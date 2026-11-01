// The guest sorcerers' voices. Yuta and Toji replay the story as themselves: everyone else's lines are the
// third-person versions (they aren't Yuji, Megumi or Nobara), and the player's own lines are Megumi's,
// rewritten in their words here (ClassDef.voiceFrom / voice). Keyed by the line they replace; an empty
// string drops the line (a scene that has a line of its own for them).

const YUTA: Record<string, string> = {
  'It acts like a beacon. Every curse for miles gets drawn in.': 'A special grade object, out in the open. Every curse nearby will come looking for it.',
  'Civilians inside. That\'s why every curse in the prefecture is converging on this building.': 'There are people inside. That\'s why the curses are gathering here. ...Okay. Let\'s hurry.',
  'Stay put. Someone will escort you out. The object is my job.': 'Please stay here. Someone will come for you. I\'ll get the box back.',
  'I don\'t save everyone. I save the people I choose to. That\'s enough reason for me.': 'Gojo-sensei told me that being needed by someone is a good reason to keep going. I still believe him.',
  'Let\'s go. People are still in there.': 'People are still in there. Let\'s go, Rika.',
  'Understood.': 'Okay. I\'ll take care of it.',
  'We can\'t save everyone. I know that. It doesn\'t make it easier.': 'I know we can\'t save everyone. ...I still wish we could.',
  'I\'m not here to arrest you. I\'m here because something is using you.': 'I\'m not here to hurt you. Something is using you, and I want to stop it.',
  'If it marks everyone who crosses, the residents are next. We should move tonight.': 'If it marks everyone who crosses, the people who live here are next. Tonight, then.',
  'Nine Death Paintings were stolen from the school years ago. Two are gone now. And there\'s an older brother.': 'Nine Death Paintings, stolen from the school. Two are gone. ...And there\'s an older brother out there.',
  'Then we get him back. Where do we start?': 'Then we bring him back. Tell me where to start.',
  'They\'ll have someone guarding it. Let\'s move.': 'Someone will be guarding it. Let\'s go.',
  'If he touches you, it\'s over. Keep your distance and hit him with everything.': 'Don\'t let him touch you. Rika and I will keep him busy.',
  'Okkotsu-senpai wouldn\'t take an order like that without a reason. I\'m going.': '',
  '...Will you win?': '...You\'ll win, right, Gojo-sensei?',
  '...He knew. He went anyway, so that we\'d have a chance.': '...He knew. He went anyway, so the rest of us would have a chance. That\'s just like him.',
  '...I know who he is.': 'Toji Fushiguro. Megumi\'s father. The sorcerer killer.',
  '...Yeah. Got it.': 'Okay. I understand.',
  'You two opened that box. Do you have any idea what was in it?': 'You opened that box? ...It\'s okay. Just stay behind me.',
  'We were sent here to confirm deaths, not to save anyone. I hate that the higher-ups were right.': 'They sent us here to confirm deaths. ...I really hate it when the higher-ups are right.',
  'A cursed technique that reshapes the body itself. This isn\'t a normal curse.': 'Something reshaped their bodies like clay. That isn\'t an ordinary curse.',
  'Blood Manipulation. Same as the Kamo clan... Let\'s go, Divine Dogs.': 'Blood Manipulation, like the Kamo clan. ...Rika, stay close.',
  'It already absorbed some of the finger\'s energy. Stay sharp.': 'It\'s already taken some of the finger\'s energy. Be careful.',
  'If I fall back, it follows me out. No retreat then.': 'If I pull back, it follows me out. ...Then I won\'t pull back.',
  'You talk too much for something that\'s about to be exorcised.': 'Sorry, but you\'re about to be exorcised. Rika is hungry.',
  'The curse only marks people who cross. It will come to us now.': 'It only marks the ones who cross. Good. Then it comes to me.',
  'A cursed womb that took on flesh. Don\'t let its blood touch you.': 'A cursed womb that grew a body. Don\'t let its blood touch you.',
  'A game where the prize is killing people. Kenjaku really thought of everything.': 'A game where the points are people\'s lives. ...Kenjaku planned all of this.',
  'I\'m not here for your points to save myself. I need them to bring someone back.': 'I don\'t need points for myself. I need them so someone else can live.',
  'I don\'t have time to be your dinner. Let\'s get this over with.': 'Sorry. I don\'t have time for this. Rika, let\'s finish it.',
  'You\'re wearing Geto-san\'s face. Take it off.': 'That\'s Geto-san\'s body. ...You don\'t get to keep it.',
  'You don\'t get to use what you took from us anymore.': 'You won\'t use what you stole from us. Not anymore.',
  '...Dad.': 'So that\'s Megumi\'s father. ...He\'s fast.',
  'Kenjaku wore your face for a year and used you for all of it. You don\'t get to talk about carrying things.': 'You told me once that I would understand you someday. I still don\'t. But I\'ll carry this.',
};

const TOJI: Record<string, string> = {
  'It acts like a beacon. Every curse for miles gets drawn in.': 'Bait. Every curse for miles is coming to dinner.',
  'Civilians inside. That\'s why every curse in the prefecture is converging on this building.': 'Civilians inside, curses all over. Somebody\'s getting a bonus for this, and it\'s me.',
  'Stay put. Someone will escort you out. The object is my job.': 'Stay here. Don\'t follow me. The box is my job.',
  'I don\'t save everyone. I save the people I choose to. That\'s enough reason for me.': 'Reasons? I get paid, I do the job. That\'s enough reason for me.',
  'Let\'s go. People are still in there.': 'Fine. Let\'s go.',
  'Understood.': 'Yeah, yeah.',
  'We can\'t save everyone. I know that. It doesn\'t make it easier.': 'Nobody saves everyone. Don\'t waste your time feeling bad about it.',
  'I\'m not here to arrest you. I\'m here because something is using you.': 'Relax. I\'m not here for you. I\'m here for whatever\'s pulling your strings.',
  'If it marks everyone who crosses, the residents are next. We should move tonight.': 'Marks whoever crosses, huh. Then tonight. I don\'t do overtime.',
  'Nine Death Paintings were stolen from the school years ago. Two are gone now. And there\'s an older brother.': 'Nine Death Paintings, two gone, a big brother out there. Sounds like a family business.',
  'Then we get him back. Where do we start?': 'Fine. Where do I start?',
  'They\'ll have someone guarding it. Let\'s move.': 'Somebody\'s guarding it. Good. Saves me looking.',
  'If he touches you, it\'s over. Keep your distance and hit him with everything.': 'He has to touch me first. Nobody touches me.',
  'Okkotsu-senpai wouldn\'t take an order like that without a reason. I\'m going.': 'A special grade, sent to do the higher-ups\' dirty work. Heh. Let\'s see what he\'s made of.',
  '...Will you win?': '...You\'ll win. Probably. Try not to make it boring.',
  '...He knew. He went anyway, so that we\'d have a chance.': '...He knew, and he went anyway. Idiot. ...Respectable idiot.',
  '...I know who he is.': '',
  '...Yeah. Got it.': 'Got it.',
  'You two opened that box. Do you have any idea what was in it?': 'You opened it. Great. Get behind me and stay quiet.',
  'We were sent here to confirm deaths, not to save anyone. I hate that the higher-ups were right.': 'They sent us to count bodies. The higher-ups were right for once. Figures.',
  'A cursed technique that reshapes the body itself. This isn\'t a normal curse.': 'Somebody played with these kids like clay. ...That\'s not a normal curse.',
  'Blood Manipulation. Same as the Kamo clan... Let\'s go, Divine Dogs.': 'Blood Manipulation. Kamo family trick. Doesn\'t matter if you can\'t hit me.',
  'It already absorbed some of the finger\'s energy. Stay sharp.': 'It ate some of the finger. Bigger target.',
  'If I fall back, it follows me out. No retreat then.': 'If I back off, it follows. So I won\'t.',
  'You talk too much for something that\'s about to be exorcised.': 'You talk too much.',
  'The curse only marks people who cross. It will come to us now.': 'It comes to whoever crosses. Good. I\'m not chasing it.',
  'A cursed womb that took on flesh. Don\'t let its blood touch you.': 'A womb that grew legs. Don\'t let the blood touch you. Or do, I\'m not your dad.',
  'A game where the prize is killing people. Kenjaku really thought of everything.': 'A game where you score points by killing. Finally, something I\'m built for.',
  'I\'m not here for your points to save myself. I need them to bring someone back.': 'Points? Keep them. I\'m here because somebody\'s paying.',
  'I don\'t have time to be your dinner. Let\'s get this over with.': 'I\'m not on the menu. Let\'s get this over with.',
  'You\'re wearing Geto-san\'s face. Take it off.': 'Wearing a dead man\'s face. Seen worse. Not by much.',
  'You don\'t get to use what you took from us anymore.': 'Whatever you stole, you\'re done using it.',
  '...Dad.': '',
  'Kenjaku wore your face for a year and used you for all of it. You don\'t get to talk about carrying things.': 'You and your big speeches. I put you in the ground once already. ...No, that was the other guy. Whatever.',
};

const FALLBACK: Record<'yuta' | 'toji', string[]> = {
  yuta: ['Okay. I\'ll handle it.', 'Right. Let\'s go, Rika.', 'Understood. Leave it to me.', 'Sorry. I\'ll do my best.', '...Okay.'],
  toji: ['Tch. Fine.', 'Whatever. Point me at it.', 'Does this pay?', 'Yeah, yeah.', 'Heh.'],
};

/** A guest's version of one of Megumi's lines ('' drops it). */
export function guestLine(voice: 'yuta' | 'toji', text: string): string {
  const map = voice === 'yuta' ? YUTA : TOJI;
  const own = map[text];
  if (own !== undefined) return own;
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  const f = FALLBACK[voice];
  return f[Math.abs(h) % f.length];
}
