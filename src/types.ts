export interface I_Settings {
  port: number
  bots: I_Bot[]
}

export interface I_Bot {
  CMD: string
  COIN1: string
  COIN2: string
  TYPE: string
  EXCHANGE: string
  API_KEY: string
  API_SECRET: string
}
