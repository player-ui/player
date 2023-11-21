#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const child_process = require('child_process')
const { camelCase } = require('change-case')
const { makeFlow } = require('@player-ui/make-flow')

const assetsMocksDir = '../../../../plugins/reference-assets/mocks'
const assetTypes = fs.readdirSync(assetsMocksDir, { withFileTypes: true })
  .filter(type => type.isDirectory())
  .map(type => type.name)

const assetSections = assetTypes.reduce((acc, currentType) => {
  const filePaths = child_process.execSync(`find ${assetsMocksDir}/${currentType} -name '*.json'`).toString().trim().split('\n').filter(p => p !== '')
  return {...acc, [currentType]: filePaths}
}, {})

const pluginsDir = '../../../../plugins'

let pluginTypes = fs.readdirSync(pluginsDir).filter(function (plugin) {
  return plugin != "reference-assets" ? fs.existsSync(pluginsDir + '/' + plugin + '/mocks') : false
}).map(type => type)

const pluginSections = pluginTypes.reduce((acc, currentType) => {
  const filePaths = child_process.execSync(`find ../../../../plugins/${currentType}/mocks/${currentType} -name '*.json'`).toString().trim().split('\n').filter(p => p !== '')
  return {...acc, [currentType]: filePaths}
}, {})

const mergedSections = {
  ...assetSections,
  ...pluginSections
}

const toFlowTuple = (flowPath, section) => {
  const { name } = path.parse(flowPath)
  return `(name: "${name != section ? name.replace(section, '').replace(/-/g, ' ').trim() : name}", flow: MockFlows.${camelCase(name)})`
}

const toFlowSection = (section, indent) => {
  const flows = mergedSections[section]
  return `${indent}(title: "${section}", flows: [
${indent}    ${flows.map(flowPath => toFlowTuple(flowPath, section)).join(`,\n${indent}    `)}
${indent}])`
}

const getFlowContents = (flowPath) => {
  const { name } = path.parse(flowPath)

  return {
    name: camelCase(name),
    json: JSON.parse(fs.readFileSync(path.resolve(process.cwd(), flowPath)))
  }
}
const pendingTransactionPluginFlow = `
static let inputAssetPendingTransaction: String = """
{
  "id": "input-validation-flow",
  "views": [
    {
      "id": "view-1",
      "type": "collection",
      "values": [
        {
          "asset": {
            "id": "input-required",
            "type": "input",
            "binding": "foo.requiredInput",
            "label": {
              "asset": {
                "id": "input-required-label",
                "type": "text",
                "value": "This input is required and must be greater than 0"
              }
            }
          }
        },
        {
          "asset": {
            "id": "action-1",
            "type": "action",
            "value": "Next",
            "label": {
              "asset": {
                "id": "action-1-label",
                "type": "text",
                "value": "Continue"
              }
            }
          }
        }
      ]
    },
    {
      "id": "view-2",
      "type": "info",
      "title": {
        "asset": {
          "id": "view-2-title",
          "type": "text",
          "value": "You made it!"
        }
      }
    }
  ],
  "schema": {
    "ROOT": {
      "foo": {
        "type": "FooType"
      }
    },
    "FooType": {
      "requiredInput": {
        "type": "IntegerPosType",
        "validation": [
          {
            "type": "required"
          }
        ]
      }
    }
  },
  "data": {},
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "view-1",
        "transitions": {
          "*": "VIEW_2"
        }
      },
      "VIEW_2": {
        "state_type": "VIEW",
        "ref": "view-2",
        "transitions": {
          "*": "END_Done"
        }
      },
      "END_Done": {
        "state_type": "END",
        "outcome": "done"
      }
    }
  }
}
"""`

const output = `// swiftlint:disable all
import PlayerUI

public struct MockFlows {
    ${Object.keys(mergedSections)
      .reduce((flows, section) => [...flows, ...mergedSections[section]], [])
      .map(flowPath => getFlowContents(flowPath))
      .map(({name, json}) => `static let ${name}: String = """
${JSON.stringify(json, null, 2).replace(/\\/g, '\\\\')}
"""`)
      .join('\n')

    }

    ${pendingTransactionPluginFlow}

    public static let assetSections: [FlowLoader.FlowSection] = [
${Object.keys(assetSections).map(section => toFlowSection(section, "        ")).join(',\n')}
    ]

    public static let pluginSections: [FlowLoader.FlowSection] = [
      ${Object.keys(pluginSections).map(section => toFlowSection(section, "        ")).join(',\n')}
      ,
      (title: "pending-transaction", flows: [
        (name: "input asset pending transaction", flow: MockFlows.inputAssetPendingTransaction)
        ])
      ]
}
`

fs.writeFileSync('../Sources/MockFlows.swift', output)