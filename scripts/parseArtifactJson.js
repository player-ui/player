#!/usr/bin/env node

const { argv } = require('process')
const fs = require('fs')

const artifactInfo = JSON.parse(fs.readFileSync(argv[2]).toString())

const zip = artifactInfo && artifactInfo.items && artifactInfo.items.find(item => item.path === 'bazel-bin/PlayerUI_Pod.zip')

if (zip) {
  console.log(zip.url)
} else {
  console.error('PlayerUI_Pod.zip not found in artifacts')
}