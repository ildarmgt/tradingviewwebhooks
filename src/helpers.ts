import fs from 'fs'

import { I_Settings } from './types'

export const readJSON = (path: any): I_Settings => {
  try {
    const res = fs.readFileSync(path).toString()
    return JSON.parse(res)
  } catch (e) {
    return {} as I_Settings
  }
}

export const dateit = () => `\n${new Date().toISOString()}::`
