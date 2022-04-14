//
//  ViewController.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 2/18/20.
//  Copyright © 2020 Intuit, Inc. All rights reserved.
//

import UIKit
import PlayerUI

class FlowViewController: UIViewController {
    @IBOutlet weak var outputLabel: UILabel!

    @IBOutlet weak var outputView: UIScrollView!

    var refreshButton: UIBarButtonItem?

    var flow: String?

    var player: Player?

    override func viewDidLoad() {
        super.viewDidLoad()

        refreshButton = UIBarButtonItem(barButtonSystemItem: .refresh, target: self, action: #selector(startFlow))

        player = Player(
            plugins: [
                ReferenceAssetsPlugin(),
                CommonTypesPlugin(),
                BeaconPlugin<DefaultBeacon>(onBeacon: {
                    print(String(describing: $0))
                })
            ]
        )

        outputView.delegate = player

        guard let player = player else { return }
        player.accessibilityIdentifier = "player-view"
        player.logLevel = .trace
        outputView.addSubview(player)
        player.translatesAutoresizingMaskIntoConstraints = false
        let height = player.heightAnchor.constraint(lessThanOrEqualTo: self.outputView.heightAnchor)
        height.priority = UILayoutPriority(250)
        NSLayoutConstraint.activate([
            player.topAnchor.constraint(equalTo: self.outputView.topAnchor, constant: 16),
            player.leadingAnchor.constraint(equalTo: self.outputView.leadingAnchor, constant: 16),
            player.trailingAnchor.constraint(equalTo: self.outputView.trailingAnchor, constant: -16),
            player.bottomAnchor.constraint(equalTo: self.outputView.bottomAnchor, constant: -16),
            player.widthAnchor.constraint(equalTo: self.outputView.widthAnchor, constant: -32),
            height
        ])
        player.alpha = 0
        startFlow()
    }

    @objc func startFlow() {
        guard let flow = flow else { return }
        
        outputView.layoutIfNeeded()
        player?.start(flow: flow, viewDidLayout: { [weak self] in
            self?.outputView.layoutSubviews()
            self?.outputView.layoutIfNeeded()
            UIView.animate(withDuration: 0.3) {
                self?.player?.alpha = 1.0
            }
        }) { [weak self] result in
            switch result {
            case .success(let result):
                self?.showAlert(message: result.endState?.outcome ?? "")
            case .failure(let error):
                self?.showAlert(message: error.localizedDescription, error: true)
            }
        }

        navigationItem.rightBarButtonItem = nil
    }

    func showAlert(message: String, error: Bool = false) {
        let alertController = UIAlertController(title: error ? "Flow Error" : "Flow Finished", message: message, preferredStyle: .alert)
        alertController.view.accessibilityIdentifier = "FlowFinished"
        alertController.addAction(UIAlertAction(title: "Done", style: .default, handler: { [weak self] _ in
            self?.navigationItem.rightBarButtonItem = self?.refreshButton
            alertController.dismiss(animated: true, completion: nil)
        }))
        present(alertController, animated: true, completion: nil)
    }
}
