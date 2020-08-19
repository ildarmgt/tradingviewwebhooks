import fs from 'fs'
import csvWriter from 'csv-write-stream'

import { dateit } from './helpers'

// display and log events
export const consoleLog = (st, ...args) => {
  const res = [ dateit(), ...args ].join(' ')
  console.log(res)
  st.log.push(res)
  logToCSV(st)
}

// write to csv file
export const logToCSV = async (st) => {
  const FILE_PATH = 'logs/output.csv'

  // create header if necessary
  try {
    let writer = csvWriter()

    if (!fs.existsSync(FILE_PATH)) {
      writer = csvWriter({
        headers: [ 'timestamp', 'entry' ]
      })
    } else {
      writer = csvWriter({ sendHeaders: false })
    }

    // add lines to file
    writer.pipe(fs.createWriteStream(FILE_PATH, { flags: 'a' }))
    while (st.log.length > 0) {
      const entry = st.log.shift()
      if (entry === undefined) break

      writer.write({
        timestamp: Date.now(),
        entry
      })
    }
    // close file
    writer.end()
  } catch (e) {
    console.warn(e)
  }
}
