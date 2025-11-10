import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Message from '#models/message'
import { DateTime } from 'luxon'

export default class MessageSeeder extends BaseSeeder {
  public async run() {
    const baseTime = DateTime.now().minus({ hours: 2 })

    await Message.createMany([
      // Channel 1 - General Discussion
      {
        channelId: 1,
        senderId: 1,
        content: 'Hey! Just joined this channel. How are things going?',
        sentAt: baseTime,
      },
      {
        channelId: 1,
        senderId: 2,
        content: 'Welcome! Things are great, glad to have you here 👋',
        sentAt: baseTime.plus({ minutes: 1 }),
      },
      {
        channelId: 1,
        senderId: 1,
        content: 'Thanks! So what do you usually discuss here?',
        sentAt: baseTime.plus({ minutes: 2 }),
      },
      {
        channelId: 1,
        senderId: 2,
        content: 'Mostly tech stuff, but also random topics. Pretty chill atmosphere.',
        sentAt: baseTime.plus({ minutes: 3 }),
      },
      {
        channelId: 1,
        senderId: 1,
        content: 'Nice! I saw your profile, you work with React?',
        sentAt: baseTime.plus({ minutes: 5 }),
      },
      {
        channelId: 1,
        senderId: 2,
        content: 'Yeah! Been using it for about 3 years now. How about you?',
        sentAt: baseTime.plus({ minutes: 6 }),
      },
      {
        channelId: 1,
        senderId: 1,
        content: 'I do mostly backend stuff with Node.js and AdonisJS lately',
        sentAt: baseTime.plus({ minutes: 7 }),
      },
      {
        channelId: 1,
        senderId: 2,
        content: 'Oh cool! AdonisJS is awesome. How are you finding it?',
        sentAt: baseTime.plus({ minutes: 8 }),
      },
      {
        channelId: 1,
        senderId: 1,
        content: 'Loving it so far. The structure is really clean and the docs are solid',
        sentAt: baseTime.plus({ minutes: 9 }),
      },
      {
        channelId: 1,
        senderId: 2,
        content: 'Definitely! The ORM is really nice too. Much better than raw SQL queries everywhere',
        sentAt: baseTime.plus({ minutes: 11 }),
      },
      {
        channelId: 1,
        senderId: 1,
        content: 'Absolutely. I just finished setting up authentication with Lucid yesterday',
        sentAt: baseTime.plus({ minutes: 13 }),
      },
      {
        channelId: 1,
        senderId: 2,
        content: 'Nice! Did you use the built-in auth or roll your own?',
        sentAt: baseTime.plus({ minutes: 14 }),
      },
      {
        channelId: 1,
        senderId: 1,
        content: 'Built-in. No point reinventing the wheel, right?',
        sentAt: baseTime.plus({ minutes: 15 }),
      },
      {
        channelId: 1,
        senderId: 2,
        content: 'Smart choice. Security is not something to DIY unless you really know what youre doing',
        sentAt: baseTime.plus({ minutes: 16 }),
      },
      {
        channelId: 1,
        senderId: 1,
        content: 'Exactly my thinking. So what are you working on these days?',
        sentAt: baseTime.plus({ minutes: 18 }),
      },
      {
        channelId: 1,
        senderId: 2,
        content: 'Building a dashboard for data visualization. Lots of charts and real-time updates',
        sentAt: baseTime.plus({ minutes: 19 }),
      },
      {
        channelId: 1,
        senderId: 1,
        content: 'Sounds complex! What are you using for the charts?',
        sentAt: baseTime.plus({ minutes: 20 }),
      },
      {
        channelId: 1,
        senderId: 2,
        content: 'Recharts mostly. Its built on D3 but way easier to use with React',
        sentAt: baseTime.plus({ minutes: 21 }),
      },
      {
        channelId: 1,
        senderId: 1,
        content: 'Ive heard good things about Recharts. How are you handling the real-time part?',
        sentAt: baseTime.plus({ minutes: 23 }),
      },
      {
        channelId: 1,
        senderId: 2,
        content: 'WebSockets! Using Socket.io on both ends',
        sentAt: baseTime.plus({ minutes: 24 }),
      },
      {
        channelId: 1,
        senderId: 1,
        content: 'Classic choice. Does it scale well for your use case?',
        sentAt: baseTime.plus({ minutes: 25 }),
      },
      {
        channelId: 1,
        senderId: 2,
        content: 'So far so good. Were only at like 200 concurrent users max, so no issues yet',
        sentAt: baseTime.plus({ minutes: 27 }),
      },
      {
        channelId: 1,
        senderId: 1,
        content: 'That should be fine. If you scale up you might want to look into Redis for pub/sub',
        sentAt: baseTime.plus({ minutes: 28 }),
      },
      {
        channelId: 1,
        senderId: 2,
        content: 'Yeah Ive been reading about that. Redis Pub/Sub with Socket.io seems like the standard approach',
        sentAt: baseTime.plus({ minutes: 30 }),
      },
      {
        channelId: 1,
        senderId: 1,
        content: 'It is. Works great for horizontal scaling across multiple server instances',
        sentAt: baseTime.plus({ minutes: 32 }),
      },
      {
        channelId: 1,
        senderId: 2,
        content: 'Good to know! Hopefully we get to that point where we need it haha',
        sentAt: baseTime.plus({ minutes: 33 }),
      },
      {
        channelId: 1,
        senderId: 1,
        content: 'Haha thats the dream right? Too many users to handle 😄',
        sentAt: baseTime.plus({ minutes: 34 }),
      },
      {
        channelId: 1,
        senderId: 2,
        content: 'Exactly! Anyway, I gotta run. Lunch break is over. Catch you later!',
        sentAt: baseTime.plus({ minutes: 36 }),
      },
      {
        channelId: 1,
        senderId: 1,
        content: 'Sure thing! Thanks for the chat, learned a lot 👍',
        sentAt: baseTime.plus({ minutes: 37 }),
      },
      {
        channelId: 1,
        senderId: 2,
        content: 'Anytime! Feel free to ping me if you have questions',
        sentAt: baseTime.plus({ minutes: 38 }),
      },

      // Channel 2 - Development Channel
      {
        channelId: 2,
        senderId: 1,
        content: 'Hey, so I started looking into that bug you mentioned',
        sentAt: baseTime.plus({ minutes: 45 }),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'Oh awesome! The one with the user sessions timing out randomly?',
        sentAt: baseTime.plus({ minutes: 46 }),
      },
      {
        channelId: 2,
        senderId: 1,
        content: 'Yeah that one. I think I found the issue',
        sentAt: baseTime.plus({ minutes: 47 }),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'Really? What was it?',
        sentAt: baseTime.plus({ minutes: 48 }),
      },
      {
        channelId: 2,
        senderId: 1,
        content: 'The session middleware was configured with a 15 minute timeout, but the frontend was polling every 20 minutes',
        sentAt: baseTime.plus({ minutes: 49 }),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'Ohhh that makes so much sense! So the session was expiring before the keep-alive',
        sentAt: baseTime.plus({ minutes: 50 }),
      },
      {
        channelId: 2,
        senderId: 1,
        content: 'Exactly. Simple fix - just changed the polling interval to 10 minutes',
        sentAt: baseTime.plus({ minutes: 52 }),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'Perfect. Did you push the fix already?',
        sentAt: baseTime.plus({ minutes: 53 }),
      },
      {
        channelId: 2,
        senderId: 1,
        content: 'Not yet, wanted to run it by you first. Should I create a PR?',
        sentAt: baseTime.plus({ minutes: 54 }),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'Yeah go ahead! Ill review it this afternoon',
        sentAt: baseTime.plus({ minutes: 55 }),
      },
      {
        channelId: 2,
        senderId: 1,
        content: 'Cool. Also, I was thinking we should add some tests for this',
        sentAt: baseTime.plus({ minutes: 57 }),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'Definitely. Can you mock the session timeout in the test?',
        sentAt: baseTime.plus({ minutes: 58 }),
      },
      {
        channelId: 2,
        senderId: 1,
        content: 'Should be doable. Ill use Jest fake timers to speed up the timeout',
        sentAt: baseTime.plus({ minutes: 60 }),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'Smart! That way we dont have to wait 15 actual minutes in the test',
        sentAt: baseTime.plus({ minutes: 61 }),
      },
      {
        channelId: 2,
        senderId: 1,
        content: 'Exactly. Ill have it done by end of day',
        sentAt: baseTime.plus({ minutes: 63 }),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'Awesome. Oh by the way, did you see the Slack message about the deployment?',
        sentAt: baseTime.plus({ minutes: 65 }),
      },
      {
        channelId: 2,
        senderId: 1,
        content: 'The one about moving to GitHub Actions?',
        sentAt: baseTime.plus({ minutes: 66 }),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'Yeah. Apparently they want to sunset our current CI/CD by next month',
        sentAt: baseTime.plus({ minutes: 67 }),
      },
      {
        channelId: 2,
        senderId: 1,
        content: 'Ugh, more migration work. Have you used GitHub Actions before?',
        sentAt: baseTime.plus({ minutes: 69 }),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'A bit. Its actually pretty straightforward. YAML config files',
        sentAt: baseTime.plus({ minutes: 70 }),
      },
      {
        channelId: 2,
        senderId: 1,
        content: 'Everything is YAML these days lol',
        sentAt: baseTime.plus({ minutes: 71 }),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'Haha true. At least its better than XML 😅',
        sentAt: baseTime.plus({ minutes: 72 }),
      },
      {
        channelId: 2,
        senderId: 1,
        content: 'Fair point. So when do we need to migrate?',
        sentAt: baseTime.plus({ minutes: 74 }),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'They said we have until the end of the month, so about 3 weeks',
        sentAt: baseTime.plus({ minutes: 75 }),
      },
      {
        channelId: 2,
        senderId: 1,
        content: 'That should be enough time. Want to pair on it next week?',
        sentAt: baseTime.plus({ minutes: 77 }),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'Yeah lets do that. Tuesday afternoon work for you?',
        sentAt: baseTime.plus({ minutes: 78 }),
      },
      {
        channelId: 2,
        senderId: 1,
        content: 'Let me check my calendar... yeah Tuesday at 2pm is free',
        sentAt: baseTime.plus({ minutes: 80 }),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'Perfect. Ill send you a calendar invite',
        sentAt: baseTime.plus({ minutes: 81 }),
      },
      {
        channelId: 2,
        senderId: 1,
        content: 'Sounds good. Should we prepare anything beforehand?',
        sentAt: baseTime.plus({ minutes: 83 }),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'Maybe look at the GitHub Actions docs? Just to get familiar with the syntax',
        sentAt: baseTime.plus({ minutes: 84 }),
      },
      {
        channelId: 2,
        senderId: 1,
        content: 'Will do. Ill also document our current pipeline so we know what to migrate',
        sentAt: baseTime.plus({ minutes: 86 }),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'Great idea! That will make things much smoother',
        sentAt: baseTime.plus({ minutes: 87 }),
      },
      {
        channelId: 2,
        senderId: 1,
        content: 'Alright, Im gonna get back to that PR now',
        sentAt: baseTime.plus({ minutes: 89 }),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'Cool, ping me when its ready for review!',
        sentAt: baseTime.plus({ minutes: 90 }),
      },
    ])
  }
}