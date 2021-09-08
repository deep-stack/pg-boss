const fs = require('fs')
const EventEmitter = require('events')
const initSqlJs = require('sql.js')

// TODO: Remove use of fs module as this is supposed to be used in browser. 
class Db extends EventEmitter {
  constructor (config) {
    super()

    config.application_name = config.application_name || 'pgboss'

    this.config = config
  }

  async open () {
    try {
      const SQL = await initSqlJs()
      const filebuffer = fs.readFileSync(this.config.dbFile)
      this.db = new SQL.Database(filebuffer)
      this.opened = true
    } catch (err) {
      this.emit('error', err)
    }
  }

  async close () {
    try {
      this.opened = false
      const data = this.db.export()
      this.db.close()

      const buffer = Buffer.from(data)
      fs.writeFileSync(this.config.dbFile, buffer)
    } catch (err) {
      this.emit('error', err)
    }
  }

  async executeSql (text, values) {
    try {
      if (this.opened) {
        const res = this.db.exec(text, values)
        const rowCount = this.db.getRowsModified()
        const toReturn = { rows: [], rowCount }

        if (res.length > 0) {
          console.log(res)
          // Get rows of result as objects, associating column names with their value in the current row.
          const keys = res[0].columns
          const rows = res[0].values.map(function (row) {
            return keys.reduce(function (obj, key, i) {
              obj[key] = row[i]
              return obj
            }, {})
          })

          toReturn.rows = rows
        }

        return toReturn
      }
    } catch (err) {
      this.emit('error', err)
    }
  }
}

module.exports = Db
