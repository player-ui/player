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
  const filePaths = child_process.execSync(`find ../../../../plugins/${currentType}/mocks -name '*.json'`).toString().trim().split('\n').filter(p => p !== '')
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
    json: makeFlow(JSON.parse(fs.readFileSync(path.resolve(process.cwd(), flowPath))))
  }
}

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
    public static let sections: [FlowLoader.FlowSection] = [
${Object.keys(mergedSections).map(section => toFlowSection(section, "        ")).join(',\n')}
    ]
}
`

fs.writeFileSync('../Sources/MockFlows.swift', output)