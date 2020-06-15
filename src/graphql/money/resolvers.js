import { log, print } from 'io.maana.shared'

import { gql } from 'apollo-server-express'
import pubsub from '../../pubsub'
import uuid from 'uuid'
import { exchangeRates } from 'exchange-rates-api'
import { convert, currencies } from 'cashify'

import _ from 'lodash'
require('dotenv').config()

const SERVICE_ID = process.env.SERVICE_ID
const SELF = SERVICE_ID || 'io.maana.template'

// dummy in-memory store

export const resolver = {
  Query: {
    info: async (_, args, { client }) => {
      let remoteId = SERVICE_ID

      try {
        if (client) {
          const query = gql`
            query info {
              info {
                id
              }
            }
          `
          const {
            data: {
              info: { id }
            }
          } = await client.query({ query })
          remoteId = id
        }
      } catch (e) {
        log(SELF).error(
          `Info Resolver failed with Exception: ${e.message}\n${print.external(
            e.stack
          )}`
        )
      }

      return {
        id: SERVICE_ID,
        name: 'io.maana.currency',
        description: `I changed the description ${remoteId}, ${process.env?.TEST_ENV_VAR}`
      }
    },
    constructCurrencyValue: async (_, { value, currency }, { client }) => {
      return {
        id: `${value.toString()}-${currency.id}`,
        currency
      }
    }
  },
  Mutation: {
    convertFloat: async (_, { value, from, to, base }, { client }) => {
      const rates = await exchangeRates()
        .latest()
        .fetch()

      const result = convert(value, {
        from: from.id,
        to: to.id,
        base: base || 'USD',
        rates
      })
      return {
        id: `${to.id}-${result.toString()}`,
        currency: {
          id: `${to.id}`
        },
        value: result
      }
    },

    convertCurrencyValue: async (_, { from, to, base }, { client }) => {
      const rates = await exchangeRates()
        .latest()
        .fetch()

      const result = convert(from.value, {
        from: from.id,
        to: to.id,
        base: base || 'USD',
        rates
      })
      return {
        id: `${to.id}-${result.toString()}`,
        currency: {
          id: `${to.id}`
        },
        value: result
      }
    },
    getAllCurrencyRates: async (_, args, { client }) => {
      const rates = await exchangeRates()
        .latest()
        .fetch()

      return Object.keys(rates).map(key => {
        const val = rates[key]
        return {
          id: `${key}-${val}`,
          currency: {
            id: `${key}`
          },
          value: `${val}`
        }
      })
    },
    getAllCurrencyRatesWithBase: async (_, { base }, { client }) => {
      const rates = await exchangeRates()
        .base(base.id)
        .latest()
        .fetch()

      console.log('rates', rates)
      return Object.keys(rates).map(key => {
        const val = rates[key]
        return {
          id: `${key}-${val}`,
          currency: {
            id: `${key}`
          },
          value: `${val}`
        }
      })
    },
    getCurrencyRate: async (parent, { currency }, { client }) => {
      const rates = await exchangeRates()
        .latest()
        .symbols([currencies[currency.id]])
        .fetch()
      return _.first(
        Object.keys(rates).map(key => {
          const val = rates[key]
          return {
            id: `${key}-${val}`,
            currency: {
              id: `${key}`
            },
            value: `${val}`
          }
        })
      )
    },
    getCurrencyRateWithBase: async (parent, { currency, base }, { client }) => {
      const rates = await exchangeRates()
        .latest()
        .base(base.id)
        .symbols([currencies[currency.id]])
        .fetch()
      return _.first(
        Object.keys(rates).map(key => {
          const val = rates[key]
          return {
            id: `${key}-${val}`,
            currency: {
              id: `${key}`
            },
            value: `${val}`
          }
        })
      )
    }
  }
}
