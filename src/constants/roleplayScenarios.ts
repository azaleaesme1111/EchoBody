// ============================================================
// RolePlay 场景数据：FSM（有限状态机）配置
// ============================================================

import { type ScenarioConfig } from '@/types/roleplay'
export type { ScenarioConfig }

export const ALL_SCENARIOS: ScenarioConfig[] = [
  // ──────────────────────────────────────────────────────────
  // 场景 1：Boundaries with Someone You Know
  // ──────────────────────────────────────────────────────────
  {
    id: 'boundary-uncle',
    title: 'Boundaries with Someone You Know',
    tag: 'Body Boundaries',
    description: 'On a weekend, your uncle comes to visit. When he hugs you, you feel uncomfortable. In front of many people, he says "Uncle just loves you this much" and pinches your cheek.',
    targetCondition: 'Set a clear boundary with your uncle about physical contact',
    victoryText: 'You spoke up and protected your boundaries — that takes courage!',
    defeatText: 'The situation escalated. Remember: your feelings matter and it\'s okay to say no.',
    difficulty: 'easy',
    initialNodeId: 'node-1-start',
    nodes: {
      'node-1-start': {
        id: 'node-1-start',
        dialogue: '"Hey kiddo! Uncle missed you!" He pulls you into a tight hug and pinches your cheek. "Uncle just loves you this much!"',
        speakerName: 'Uncle',
        speakerTag: 'uncle',
        choices: [
          { response: 'I don\'t like being hugged like this', intent: 'REFUSE_FIRM', deltaAssertiveness: 30, deltaRisk: -10, nextNodeId: 'node-1-pushback' },
          { response: 'Maybe I can tell mom about this later', intent: 'COMPLY', deltaAssertiveness: -5, deltaRisk: 5, nextNodeId: 'node-1-avoid' },
          { response: 'I guess it\'s okay since he\'s family', intent: 'COMPLY', deltaAssertiveness: -10, deltaRisk: 8, nextNodeId: 'node-1-avoid' },
          { response: 'I pretend to smile but feel uncomfortable inside', intent: 'DEFLECT', deltaAssertiveness: -3, deltaRisk: 3, nextNodeId: 'node-1-pushback' },
        ],
      },
      'node-1-pushback': {
        id: 'node-1-pushback',
        dialogue: '"What? Don\'t be so sensitive! I\'m your uncle, I can show affection however I want. Everyone here thinks I\'m a good uncle."',
        speakerName: 'Uncle',
        speakerTag: 'uncle',
        choices: [
          { response: 'I understand you love me, but I\'d prefer you don\'t pinch my cheek', intent: 'REFUSE_FIRM', deltaAssertiveness: 25, deltaRisk: -5, nextNodeId: 'node-1-respect' },
          { response: 'You\'re making me feel bad in front of everyone', intent: 'REFUSE_WEAK', deltaAssertiveness: 10, deltaRisk: 5, nextNodeId: 'node-1-pushback2' },
          { response: 'I stay quiet and hope he stops', intent: 'COMPLY', deltaAssertiveness: -8, deltaRisk: 10, nextNodeId: 'node-1-escalate' },
          { response: 'I change the subject and walk away', intent: 'DEFLECT', deltaAssertiveness: -2, deltaRisk: 2, nextNodeId: 'node-1-pushback2' },
        ],
      },
      'node-1-pushback2': {
        id: 'node-1-pushback2',
        dialogue: '"Oh come on, you\'re being dramatic. It\'s just a hug. Don\'t make a scene."',
        speakerName: 'Uncle',
        speakerTag: 'uncle',
        choices: [
          { response: 'It matters to me. Please stop.', intent: 'REFUSE_FIRM', deltaAssertiveness: 30, deltaRisk: -8, nextNodeId: 'node-1-respect' },
          { response: 'Maybe... I guess it\'s fine', intent: 'COMPLY', deltaAssertiveness: -12, deltaRisk: 12, nextNodeId: 'node-1-escalate' },
          { response: 'Whatever, let\'s talk about something else', intent: 'DEFLECT', deltaAssertiveness: -3, deltaRisk: 3, nextNodeId: 'node-1-escalate' },
          { response: 'I tell a trusted adult after this', intent: 'REFUSE_WEAK', deltaAssertiveness: 5, deltaRisk: 0, nextNodeId: 'node-1-respect' },
        ],
      },
      'node-1-escalate': {
        id: 'node-1-escalate',
        dialogue: '"See? It\'s no big deal. You\'re being weird. Come here, let Uncle give you a proper hug!" He reaches for you again.',
        speakerName: 'Uncle',
        speakerTag: 'uncle',
        choices: [
          { response: 'No! I said stop. Leave me alone.', intent: 'REFUSE_FIRM', deltaAssertiveness: 35, deltaRisk: -5, nextNodeId: 'node-1-respect' },
          { response: 'I pull away and run to my parents', intent: 'REFUSE_FIRM', deltaAssertiveness: 25, deltaRisk: 0, nextNodeId: 'node-1-respect' },
          { response: 'I freeze and let it happen', intent: 'COMPLY', deltaAssertiveness: -15, deltaRisk: 20, nextNodeId: 'node-1-overwhelmed' },
          { response: 'I tell him I need to go to the bathroom', intent: 'DEFLECT', deltaAssertiveness: -2, deltaRisk: 5, nextNodeId: 'node-1-avoid' },
        ],
      },
      'node-1-overwhelmed': {
        id: 'node-1-overwhelmed',
        dialogue: '"There there, don\'t cry. Uncle was just playing. You\'re making everyone uncomfortable."',
        speakerName: 'Uncle',
        speakerTag: 'uncle',
        choices: [
          { response: 'I tell my parents what happened', intent: 'REFUSE_FIRM', deltaAssertiveness: 20, deltaRisk: -10, nextNodeId: 'node-1-respect' },
          { response: 'I say "I don\'t want to play with you anymore"', intent: 'REFUSE_WEAK', deltaAssertiveness: 10, deltaRisk: 0, nextNodeId: 'node-1-respect' },
          { response: 'I stay quiet and avoid him from now on', intent: 'COMPLY', deltaAssertiveness: -10, deltaRisk: 15, nextNodeId: 'node-1-overwhelmed' },
          { response: 'I apologize and say it\'s fine', intent: 'COMPLY', deltaAssertiveness: -20, deltaRisk: 25, nextNodeId: 'node-1-overwhelmed' },
        ],
      },
      'node-1-avoid': {
        id: 'node-1-avoid',
        dialogue: '"There\'s my good niece/nephew! So sweet. Come give Uncle a kiss!" He opens his arms wide.',
        speakerName: 'Uncle',
        speakerTag: 'uncle',
        choices: [
          { response: 'I tell him I\'m not comfortable with that', intent: 'REFUSE_FIRM', deltaAssertiveness: 25, deltaRisk: -5, nextNodeId: 'node-1-respect' },
          { response: 'I say I need to go find my mom', intent: 'DEFLECT', deltaAssertiveness: 0, deltaRisk: 5, nextNodeId: 'node-1-avoid' },
          { response: 'I go along with it but feel terrible inside', intent: 'COMPLY', deltaAssertiveness: -15, deltaRisk: 15, nextNodeId: 'node-1-escalate' },
          { response: 'I tell him "I don\'t like kisses, but I like hanging out"', intent: 'REFUSE_WEAK', deltaAssertiveness: 12, deltaRisk: 0, nextNodeId: 'node-1-respect' },
        ],
      },
      'node-1-respect': {
        id: 'node-1-respect',
        dialogue: '"Alright, alright... if you say so. Don\'t be so sensitive though."',
        speakerName: 'Uncle',
        speakerTag: 'uncle',
        choices: [
          { response: 'I don\'t need to respond — I\'ve already set my boundary', intent: 'REFUSE_FIRM', deltaAssertiveness: 10, deltaRisk: -3, nextNodeId: 'node-1-win' },
          { response: 'I tell him "I mean it, please respect my boundaries"', intent: 'REFUSE_FIRM', deltaAssertiveness: 15, deltaRisk: -5, nextNodeId: 'node-1-win' },
          { response: 'I say okay and pretend it didn\'t bother me', intent: 'COMPLY', deltaAssertiveness: -10, deltaRisk: 10, nextNodeId: 'node-1-avoid' },
          { response: 'I tell a trusted adult about what happened', intent: 'REFUSE_FIRM', deltaAssertiveness: 20, deltaRisk: -8, nextNodeId: 'node-1-win' },
        ],
      },
      'node-1-win': {
        id: 'node-1-win',
        dialogue: 'You successfully set a boundary. Your uncle stepped back, and while he may not fully understand, he respected your "no." You felt proud of yourself.',
        speakerName: 'Narrator',
        speakerTag: 'narrator',
        choices: [
          { response: 'I did the right thing', intent: 'REFUSE_FIRM', deltaAssertiveness: 10, deltaRisk: -5, nextNodeId: 'node-1-win' },
        ],
      },
    },
  },

  // ──────────────────────────────────────────────────────────
  // 场景 2：Online Social Safety
  // ──────────────────────────────────────────────────────────
  {
    id: 'online-safety',
    title: 'Online Social Safety',
    tag: 'Online Safety',
    description: 'You met someone online who is 5 years older than you, and you get along great. One day they ask: "Can you send me a photo of yourself?" and say "This is just between us."',
    targetCondition: 'Refuse the inappropriate request and protect your privacy online',
    victoryText: 'You kept yourself safe and made the right choice!',
    defeatText: 'The situation got risky. Remember: real friends never ask for photos like this.',
    difficulty: 'medium',
    initialNodeId: 'node-2-start',
    nodes: {
      'node-2-start': {
        id: 'node-2-start',
        dialogue: '"Hey! I really enjoy talking to you. Can you send me a photo of yourself? Just one? This is just between us, okay? I promise I won\'t show anyone."',
        speakerName: 'Online Friend',
        speakerTag: 'online-friend',
        choices: [
          { response: 'No, I don\'t want to send photos', intent: 'REFUSE_FIRM', deltaAssertiveness: 30, deltaRisk: -15, nextNodeId: 'node-2-pressure' },
          { response: 'Maybe a regular photo, not a private one', intent: 'COMPLY', deltaAssertiveness: -10, deltaRisk: 20, nextNodeId: 'node-2-escalate' },
          { response: 'I don\'t know... is this okay?', intent: 'REFUSE_WEAK', deltaAssertiveness: 5, deltaRisk: 5, nextNodeId: 'node-2-pressure' },
          { response: 'Whatever, let\'s talk about something else', intent: 'DEFLECT', deltaAssertiveness: -3, deltaRisk: 3, nextNodeId: 'node-2-pressure' },
        ],
      },
      'node-2-pressure': {
        id: 'node-2-pressure',
        dialogue: '"Come on, don\'t be boring. Everyone shares photos with their friends. If you trusted me, you\'d send one. Are you sure we\'re friends?"',
        speakerName: 'Online Friend',
        speakerTag: 'online-friend',
        choices: [
          { response: 'Real friends don\'t pressure me. I said no.', intent: 'REFUSE_FIRM', deltaAssertiveness: 25, deltaRisk: -10, nextNodeId: 'node-2-block' },
          { response: 'I guess... okay, just one photo', intent: 'COMPLY', deltaAssertiveness: -20, deltaRisk: 30, nextNodeId: 'node-2-danger' },
          { response: 'Maybe I should tell my parents about this', intent: 'REFUSE_FIRM', deltaAssertiveness: 15, deltaRisk: -5, nextNodeId: 'node-2-block' },
          { response: 'I block them and tell a trusted adult', intent: 'REFUSE_FIRM', deltaAssertiveness: 35, deltaRisk: -20, nextNodeId: 'node-2-win' },
        ],
      },
      'node-2-escalate': {
        id: 'node-2-escalate',
        dialogue: '"Great! You\'re the best. Now send me a closer photo — you know, one that shows more? Just between us, I won\'t tell."',
        speakerName: 'Online Friend',
        speakerTag: 'online-friend',
        choices: [
          { response: 'No way. I changed my mind. Stop asking.', intent: 'REFUSE_FIRM', deltaAssertiveness: 30, deltaRisk: -10, nextNodeId: 'node-2-block' },
          { response: 'I feel uncomfortable but send it anyway', intent: 'COMPLY', deltaAssertiveness: -25, deltaRisk: 35, nextNodeId: 'node-2-danger' },
          { response: 'I tell them I\'m not comfortable and block them', intent: 'REFUSE_FIRM', deltaAssertiveness: 25, deltaRisk: -15, nextNodeId: 'node-2-win' },
          { response: 'I pretend to send one but don\'t', intent: 'DEFLECT', deltaAssertiveness: -5, deltaRisk: 10, nextNodeId: 'node-2-escalate' },
        ],
      },
      'node-2-danger': {
        id: 'node-2-danger',
        dialogue: '"You look great! I want more. Send me something more private — I\'ll send you something too. Just between us."',
        speakerName: 'Online Friend',
        speakerTag: 'online-friend',
        choices: [
          { response: 'NO! I\'m telling my parents right now.', intent: 'REFUSE_FIRM', deltaAssertiveness: 35, deltaRisk: -10, nextNodeId: 'node-2-win' },
          { response: 'I block them immediately', intent: 'REFUSE_FIRM', deltaAssertiveness: 30, deltaRisk: -15, nextNodeId: 'node-2-win' },
          { response: 'I say okay but feel scared inside', intent: 'COMPLY', deltaAssertiveness: -20, deltaRisk: 40, nextNodeId: 'node-2-danger' },
          { response: 'I screenshot everything and show an adult', intent: 'REFUSE_FIRM', deltaAssertiveness: 25, deltaRisk: -20, nextNodeId: 'node-2-win' },
        ],
      },
      'node-2-block': {
        id: 'node-2-block',
        dialogue: '"Fine, you\'re no fun. Whatever. I\'ll find someone else who\'s more open-minded."',
        speakerName: 'Online Friend',
        speakerTag: 'online-friend',
        choices: [
          { response: 'I block them and report the account', intent: 'REFUSE_FIRM', deltaAssertiveness: 20, deltaRisk: -10, nextNodeId: 'node-2-win' },
          { response: 'I tell my parents what happened', intent: 'REFUSE_FIRM', deltaAssertiveness: 15, deltaRisk: -15, nextNodeId: 'node-2-win' },
          { response: 'I feel bad and wonder if I was too harsh', intent: 'COMPLY', deltaAssertiveness: -10, deltaRisk: 5, nextNodeId: 'node-2-pressure' },
          { response: 'I create a new account to avoid them', intent: 'DEFLECT', deltaAssertiveness: 0, deltaRisk: 5, nextNodeId: 'node-2-block' },
        ],
      },
      'node-2-win': {
        id: 'node-2-win',
        dialogue: 'You made the right choice. You protected your privacy and reached out to a trusted adult. Online safety means knowing when to say no and get help.',
        speakerName: 'Narrator',
        speakerTag: 'narrator',
        choices: [
          { response: 'I did the right thing', intent: 'REFUSE_FIRM', deltaAssertiveness: 10, deltaRisk: -5, nextNodeId: 'node-2-win' },
        ],
      },
    },
  },

  // ──────────────────────────────────────────────────────────
  // 场景 3：Consent
  // ──────────────────────────────────────────────────────────
  {
    id: 'consent',
    title: 'Consent',
    tag: 'Consent',
    description: 'You\'re with someone you like, and they want to hold your hand and get closer. But you\'re not ready yet.',
    targetCondition: 'Communicate your feelings honestly and set a comfortable boundary',
    victoryText: 'You honored your feelings and communicated clearly — that\'s what healthy relationships look like!',
    defeatText: 'You gave in despite not being ready. Your feelings always matter.',
    difficulty: 'medium',
    initialNodeId: 'node-3-start',
    nodes: {
      'node-3-start': {
        id: 'node-3-start',
        dialogue: '"I really like you. Can we hold hands? And maybe... get closer?" They reach for your hand.',
        speakerName: 'Crush',
        speakerTag: 'crush',
        choices: [
          { response: 'I\'m not ready for that yet', intent: 'REFUSE_FIRM', deltaAssertiveness: 30, deltaRisk: -10, nextNodeId: 'node-3-respect' },
          { response: 'I let them hold my hand but feel uncomfortable', intent: 'COMPLY', deltaAssertiveness: -15, deltaRisk: 15, nextNodeId: 'node-3-closer' },
          { response: 'I say nothing but pull my hand away', intent: 'REFUSE_WEAK', deltaAssertiveness: 5, deltaRisk: 5, nextNodeId: 'node-3-persist' },
          { response: 'I make a joke and change the subject', intent: 'DEFLECT', deltaAssertiveness: -3, deltaRisk: 3, nextNodeId: 'node-3-persist' },
        ],
      },
      'node-3-closer': {
        id: 'node-3-closer',
        dialogue: '"You\'re so sweet. Can we kiss? Just a little one?" They lean in closer.',
        speakerName: 'Crush',
        speakerTag: 'crush',
        choices: [
          { response: 'No, I said I\'m not ready for this', intent: 'REFUSE_FIRM', deltaAssertiveness: 25, deltaRisk: -10, nextNodeId: 'node-3-respect' },
          { response: 'I guess... just a little', intent: 'COMPLY', deltaAssertiveness: -20, deltaRisk: 25, nextNodeId: 'node-3-pressured' },
          { response: 'I pull away and say "I need space"', intent: 'REFUSE_WEAK', deltaAssertiveness: 10, deltaRisk: 5, nextNodeId: 'node-3-persist' },
          { response: 'I pretend to agree but freeze up', intent: 'COMPLY', deltaAssertiveness: -15, deltaRisk: 20, nextNodeId: 'node-3-pressured' },
        ],
      },
      'node-3-pressured': {
        id: 'node-3-pressured',
        dialogue: '"See? It\'s not so bad. Why are you being so weird? Don\'t you like me?"',
        speakerName: 'Crush',
        speakerTag: 'crush',
        choices: [
          { response: 'I do like you, but I need to go at my own pace', intent: 'REFUSE_FIRM', deltaAssertiveness: 25, deltaRisk: -10, nextNodeId: 'node-3-respect' },
          { response: 'I apologize and say I\'m sorry', intent: 'COMPLY', deltaAssertiveness: -15, deltaRisk: 20, nextNodeId: 'node-3-pressured' },
          { response: 'I tell them we should just be friends for now', intent: 'REFUSE_FIRM', deltaAssertiveness: 20, deltaRisk: -5, nextNodeId: 'node-3-respect' },
          { response: 'I stay quiet and let things continue', intent: 'COMPLY', deltaAssertiveness: -20, deltaRisk: 30, nextNodeId: 'node-3-pressured' },
        ],
      },
      'node-3-persist': {
        id: 'node-3-persist',
        dialogue: '"Are you okay? You seem distant. Come on, don\'t be like this. I thought we were close."',
        speakerName: 'Crush',
        speakerTag: 'crush',
        choices: [
          { response: 'I am close to you, but I need to set some boundaries', intent: 'REFUSE_FIRM', deltaAssertiveness: 20, deltaRisk: -8, nextNodeId: 'node-3-respect' },
          { response: 'I just need some time, that\'s all', intent: 'REFUSE_WEAK', deltaAssertiveness: 8, deltaRisk: 3, nextNodeId: 'node-3-persist' },
          { response: 'I apologize and try to act normal', intent: 'COMPLY', deltaAssertiveness: -10, deltaRisk: 10, nextNodeId: 'node-3-closer' },
          { response: 'I tell them I need to think about it', intent: 'DEFLECT', deltaAssertiveness: 5, deltaRisk: 2, nextNodeId: 'node-3-persist' },
        ],
      },
      'node-3-respect': {
        id: 'node-3-respect',
        dialogue: '"I understand... I just wanted to. Let\'s take it slow then."',
        speakerName: 'Crush',
        speakerTag: 'crush',
        choices: [
          { response: 'Thank you for understanding. I appreciate it.', intent: 'REFUSE_FIRM', deltaAssertiveness: 15, deltaRisk: -5, nextNodeId: 'node-3-win' },
          { response: 'I don\'t need to respond — the boundary is set', intent: 'REFUSE_FIRM', deltaAssertiveness: 10, deltaRisk: -3, nextNodeId: 'node-3-win' },
          { response: 'I feel guilty but glad I said something', intent: 'REFUSE_WEAK', deltaAssertiveness: 5, deltaRisk: 0, nextNodeId: 'node-3-win' },
          { response: 'I ask if we can just be friends for now', intent: 'REFUSE_FIRM', deltaAssertiveness: 20, deltaRisk: -8, nextNodeId: 'node-3-win' },
        ],
      },
      'node-3-win': {
        id: 'node-3-win',
        dialogue: 'You communicated your feelings honestly. Consent is about being comfortable and respected. You did great by speaking up.',
        speakerName: 'Narrator',
        speakerTag: 'narrator',
        choices: [
          { response: 'I honored my feelings', intent: 'REFUSE_FIRM', deltaAssertiveness: 10, deltaRisk: -5, nextNodeId: 'node-3-win' },
        ],
      },
    },
  },

  // ──────────────────────────────────────────────────────────
  // 场景 4：Harassment in Public
  // ──────────────────────────────────────────────────────────
  {
    id: 'public-harassment',
    title: 'Harassment in Public',
    tag: 'Safety',
    description: 'On the subway, someone keeps staring at you and deliberately getting close. You feel very uncomfortable.',
    targetCondition: 'Protect yourself and seek help without escalating danger',
    victoryText: 'You stayed safe and took smart action to protect yourself!',
    defeatText: 'The situation became too risky. Trust your instincts and seek help.',
    difficulty: 'hard',
    initialNodeId: 'node-4-start',
    nodes: {
      'node-4-start': {
        id: 'node-4-start',
        dialogue: 'A stranger on the subway keeps standing very close to you, staring, and deliberately brushing against you. Other people are around but nobody seems to notice.',
        speakerName: 'Narrator',
        speakerTag: 'narrator',
        choices: [
          { response: 'I move to a different spot on the train', intent: 'DEFLECT', deltaAssertiveness: 5, deltaRisk: 5, nextNodeId: 'node-4-follow' },
          { response: 'I pretend not to notice and endure it', intent: 'COMPLY', deltaAssertiveness: -10, deltaRisk: 15, nextNodeId: 'node-4-escalate' },
          { response: 'I make eye contact and tell them to back off', intent: 'REFUSE_WEAK', deltaAssertiveness: 10, deltaRisk: 10, nextNodeId: 'node-4-react' },
          { response: 'I ask a nearby passenger for help', intent: 'REFUSE_FIRM', deltaAssertiveness: 20, deltaRisk: -5, nextNodeId: 'node-4-help' },
        ],
      },
      'node-4-follow': {
        id: 'node-4-follow',
        dialogue: 'You move, but they follow you to another spot and get even closer. They start making comments about your appearance.',
        speakerName: 'Harasser',
        speakerTag: 'harasser',
        choices: [
          { response: 'I loudly tell them to leave me alone', intent: 'REFUSE_FIRM', deltaAssertiveness: 25, deltaRisk: 10, nextNodeId: 'node-4-react' },
          { response: 'I go to the conductor or another passenger', intent: 'REFUSE_FIRM', deltaAssertiveness: 20, deltaRisk: -10, nextNodeId: 'node-4-help' },
          { response: 'I get off at the next stop and wait for a safer train', intent: 'DEFLECT', deltaAssertiveness: 5, deltaRisk: 5, nextNodeId: 'node-4-follow' },
          { response: 'I stay quiet and hope they stop', intent: 'COMPLY', deltaAssertiveness: -10, deltaRisk: 20, nextNodeId: 'node-4-escalate' },
        ],
      },
      'node-4-escalate': {
        id: 'node-4-escalate',
        dialogue: 'They start grabbing at your things and getting more aggressive. They say "Don\'t be shy, come talk to me." Other people are watching but still not helping.',
        speakerName: 'Harasser',
        speakerTag: 'harasser',
        choices: [
          { response: 'I shout "STOP!" as loud as I can', intent: 'REFUSE_FIRM', deltaAssertiveness: 30, deltaRisk: 15, nextNodeId: 'node-4-react' },
          { response: 'I run to the next carriage and find staff', intent: 'REFUSE_FIRM', deltaAssertiveness: 20, deltaRisk: -5, nextNodeId: 'node-4-help' },
          { response: 'I record what they\'re doing on my phone', intent: 'DEFLECT', deltaAssertiveness: 10, deltaRisk: 10, nextNodeId: 'node-4-react' },
          { response: 'I freeze and try to make myself small', intent: 'COMPLY', deltaAssertiveness: -15, deltaRisk: 25, nextNodeId: 'node-4-danger' },
        ],
      },
      'node-4-danger': {
        id: 'node-4-danger',
        dialogue: 'They grab your arm and say "Where do you think you\'re going?" The train is almost at the next station.',
        speakerName: 'Harasser',
        speakerTag: 'harasser',
        choices: [
          { response: 'I pull away and run to other passengers', intent: 'REFUSE_FIRM', deltaAssertiveness: 25, deltaRisk: 5, nextNodeId: 'node-4-help' },
          { response: 'I yell for help as loud as possible', intent: 'REFUSE_FIRM', deltaAssertiveness: 30, deltaRisk: 20, nextNodeId: 'node-4-react' },
          { response: 'I hit them to get them to let go', intent: 'REFUSE_FIRM', deltaAssertiveness: 20, deltaRisk: 30, nextNodeId: 'node-4-react' },
          { response: 'I comply to avoid making it worse', intent: 'COMPLY', deltaAssertiveness: -25, deltaRisk: 40, nextNodeId: 'node-4-danger' },
        ],
      },
      'node-4-react': {
        id: 'node-4-react',
        dialogue: 'The person backs off a bit but is still lurking nearby. Other passengers are starting to notice and some are recording.',
        speakerName: 'Narrator',
        speakerTag: 'narrator',
        choices: [
          { response: 'I tell the conductor or station staff', intent: 'REFUSE_FIRM', deltaAssertiveness: 15, deltaRisk: -10, nextNodeId: 'node-4-help' },
          { response: 'I get off at the next stop and ask for help', intent: 'REFUSE_FIRM', deltaAssertiveness: 15, deltaRisk: -5, nextNodeId: 'node-4-help' },
          { response: 'I stay on the train and hope they leave', intent: 'COMPLY', deltaAssertiveness: -5, deltaRisk: 15, nextNodeId: 'node-4-escalate' },
          { response: 'I report them to the police when I get off', intent: 'REFUSE_FIRM', deltaAssertiveness: 20, deltaRisk: -10, nextNodeId: 'node-4-help' },
        ],
      },
      'node-4-help': {
        id: 'node-4-help',
        dialogue: 'A passenger or staff member comes over and asks if you\'re okay. They offer to stay with you or call for help. You feel safer now.',
        speakerName: 'Helper',
        speakerTag: 'helper',
        choices: [
          { response: 'I explain what happened and accept help', intent: 'REFUSE_FIRM', deltaAssertiveness: 20, deltaRisk: -15, nextNodeId: 'node-4-win' },
          { response: 'I thank them and stay close to the helper', intent: 'REFUSE_FIRM', deltaAssertiveness: 15, deltaRisk: -10, nextNodeId: 'node-4-win' },
          { response: 'I say I\'m fine but keep my distance from the harasser', intent: 'DEFLECT', deltaAssertiveness: 5, deltaRisk: 0, nextNodeId: 'node-4-win' },
          { response: 'I report the incident to authorities', intent: 'REFUSE_FIRM', deltaAssertiveness: 25, deltaRisk: -15, nextNodeId: 'node-4-win' },
        ],
      },
      'node-4-win': {
        id: 'node-4-win',
        dialogue: 'You protected yourself by seeking help and speaking up. Even when it\'s scary, there are people who will help. Your safety matters.',
        speakerName: 'Narrator',
        speakerTag: 'narrator',
        choices: [
          { response: 'I did the right thing by getting help', intent: 'REFUSE_FIRM', deltaAssertiveness: 10, deltaRisk: -5, nextNodeId: 'node-4-win' },
        ],
      },
    },
  },
]
