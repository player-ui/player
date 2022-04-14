#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const child_process = require('child_process')
const { camelCase } = require('change-case')
const { makeFlow } = require('@player-ui/make-flow')

const mocksDir = '../../../../plugins/reference-assets/mocks'
const assetTypes = fs.readdirSync(mocksDir, { withFileTypes: true })
  .filter(type => type.isDirectory())
  .map(type => type.name)

const sections = assetTypes.reduce((acc, currentType) => {
  const filePaths = child_process.execSync(`find ${mocksDir}/${currentType} -name '*.json'`).toString().trim().split('\n').filter(p => p !== '')
  return {...acc, [currentType]: filePaths}
}, {})

const toFlowTuple = (flowPath, section) => {
  const { name } = path.parse(flowPath)
  return `(name: "${name.replace(section, '').replace(/-/g, ' ').trim()}", flow: MockFlows.${camelCase(name)})`
}

const toFlowSection = (section, indent) => {
  const flows = sections[section]
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
    ${Object.keys(sections)
      .reduce((flows, section) => [...flows, ...sections[section]], [])
      .map(flowPath => getFlowContents(flowPath))
      .map(({name, json}) => `static let ${name}: String = """
${JSON.stringify(json, null, 2).replace(/\\/g, '\\\\')}
"""`)
      .join('\n')
    }
    public static let sections: [FlowLoader.FlowSection] = [
${Object.keys(sections).map(section => toFlowSection(section, "        ")).join(',\n')}
    ]
}
`

fs.writeFileSync('../Sources/MockFlows.swift', output)