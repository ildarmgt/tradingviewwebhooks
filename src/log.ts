import { dateit } from './helpers'

// display and log events
export const consoleLog = (st, ...args) => {
  const res = [ dateit(), ...args ].join(' ')
  console.log(res)
  st.log.push(res)
}
