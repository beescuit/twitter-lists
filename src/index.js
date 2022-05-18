const fs = require('fs')
const Twit = require('twit')
 
const T = new Twit({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
})

const listFiles = fs.readdirSync('../').filter(name => name.endsWith('.json'))

listFiles.forEach(updateList)

async function updateList(listFile) {
  const list = require(`../${listFile}`)

  const { data } = await T.get('lists/members', { list_id: list.id, count: 5000 })

  const currentUsers = data.users.map(y => y.screen_name)

  const addedUsers = list.users.filter(x => !currentUsers.includes(x)).map(user => ({action: 'create', user}))
  const removedUsers = currentUsers.filter(x => !list.users.includes(x)).map(user => ({action: 'destroy', user}))

  const modifications = [...addedUsers, ...removedUsers]

  for (mod of modifications) {
    const {data: data_action} = await T.post(`lists/members/${mod.action}`, { list_id: list.id, screen_name: mod.user })
    if (data_action.id) {
      console.log(`${mod.action === 'create' ? 'Added' : 'Removed'} user ${mod.user} from list id ${list.id}`)
    }
  }

  console.log(`${modifications.length} modifications done.`)
}
