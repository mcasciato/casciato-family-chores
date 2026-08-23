/**
 * Family Theme Packs Dictionary
 * Configures all dynamic terminology, icons, currency symbols, and non-violent avatars
 */

export const THEME_PACKS = {
  nature: {
    id: 'nature',
    name: 'Cozy Basecamp',
    icon: '🏕️',
    tagline: 'Wildlife, camping, and forest scout badges',
    description: 'Wholesome outdoor adventures with friendly woodland animals and acorn rewards.',
    householdLabel: 'Family Basecamp',
    householdPlaceholder: 'e.g. Pine Ridge Basecamp',
    memberLabel: 'Scout',
    membersLabel: 'Scouts',
    addMemberLabel: 'Add Scout',
    memberSelectPrompt: 'Select your scout profile to start your daily tasks!',
    taskLabel: 'Daily Tasks & Chores',
    taskSingle: 'Task',
    tasksTab: 'Tasks & Chores',
    rewardLabel: 'Trading Post',
    rewardsTab: 'Trading Post',
    currencyName: 'Acorns',
    currencyIcon: '🌰',
    adminLabel: 'Ranger Station',
    heroCardPrefix: 'Camp Scout',
    avatars: ['🦊', '🐻', '🐼', '🦝', '🦉', '🏕️', '🌲', '🌻', '🦥', '🐾', '🐿️', '🐝']
  },

  cosmic: {
    id: 'cosmic',
    name: 'Cosmic Crew',
    icon: '🚀',
    tagline: 'Space exploration, discovery, and galaxy missions',
    description: 'High-tech exploration for cadets and astronauts collecting star credits.',
    householdLabel: 'Space Fleet',
    householdPlaceholder: 'e.g. Orion Space Station',
    memberLabel: 'Explorer',
    membersLabel: 'Crew',
    addMemberLabel: 'Add Cadet',
    memberSelectPrompt: 'Select your crew profile to check your flight missions!',
    taskLabel: 'Flight Missions',
    taskSingle: 'Mission',
    tasksTab: 'Missions',
    rewardLabel: 'Supply Depot',
    rewardsTab: 'Supply Depot',
    currencyName: 'Star Credits',
    currencyIcon: '⭐',
    adminLabel: 'Mission Control',
    heroCardPrefix: 'Crew Cadet',
    avatars: ['🚀', '🪐', '🛸', '👨‍🚀', '👩‍🚀', '🛰️', '☄️', '👾', '🔭', '🌟', '🌙', '🌌']
  },

  champions: {
    id: 'champions',
    name: 'Everyday Champions',
    icon: '⚡',
    tagline: 'Clean, modern teamwork and habit building',
    description: 'Empowering goals, daily habits, and achievements for all ages and teens.',
    householdLabel: 'Family Team',
    householdPlaceholder: 'e.g. Team Casciato',
    memberLabel: 'Team Member',
    membersLabel: 'Team',
    addMemberLabel: 'Add Member',
    memberSelectPrompt: 'Select your profile to check off your daily goals!',
    taskLabel: 'Goals & Habits',
    taskSingle: 'Goal',
    tasksTab: 'Goals & Habits',
    rewardLabel: 'Reward Shop',
    rewardsTab: 'Reward Shop',
    currencyName: 'Points',
    currencyIcon: '🏆',
    adminLabel: 'Parent Hub',
    heroCardPrefix: 'Team Member',
    avatars: ['⚡', '🏆', '🎯', '💡', '🎨', '🎸', '🛹', '🎧', '⭐', '👟', '🏀', '🚴']
  },

  magic: {
    id: 'magic',
    name: 'Enchanted Realm',
    icon: '✨',
    tagline: 'Peaceful magic, crystals, and charms',
    description: 'Whimsical wonder with crystals, friendly mythical creatures, and zero combat.',
    householdLabel: 'Sanctuary Realm',
    householdPlaceholder: 'e.g. Starlight Sanctuary',
    memberLabel: 'Apprentice',
    membersLabel: 'Apprentices',
    addMemberLabel: 'Add Apprentice',
    memberSelectPrompt: 'Select your apprentice profile to practice your daily charms!',
    taskLabel: 'Daily Charms & Rituals',
    taskSingle: 'Charm',
    tasksTab: 'Daily Charms',
    rewardLabel: 'Magic Vault',
    rewardsTab: 'Magic Vault',
    currencyName: 'Crystals',
    currencyIcon: '💎',
    adminLabel: 'High Council',
    heroCardPrefix: 'Apprentice',
    avatars: ['🔮', '✨', '🦄', '🧙‍♂️', '🧝‍♀️', '🏰', '🦉', '📜', '💎', '🗝️', '🕊️', '🌿']
  },

  arcade: {
    id: 'arcade',
    name: 'Pixel Arcade',
    icon: '🕹️',
    tagline: 'Retro 8-bit gaming and high scores',
    description: 'Classic gaming fun with pixel avatars, daily level-ups, and prize tickets.',
    householdLabel: 'Arcade Clubhouse',
    householdPlaceholder: 'e.g. 8-Bit Squad',
    memberLabel: 'Player',
    membersLabel: 'Players',
    addMemberLabel: 'Add Player',
    memberSelectPrompt: 'Select your player profile to clear your daily levels!',
    taskLabel: 'Daily Levels',
    taskSingle: 'Level',
    tasksTab: 'Daily Levels',
    rewardLabel: 'Prize Counter',
    rewardsTab: 'Prize Counter',
    currencyName: 'Tokens',
    currencyIcon: '🪙',
    adminLabel: 'Admin Lounge',
    heroCardPrefix: 'Player',
    avatars: ['🕹️', '👾', '🎮', '🍄', '⭐', '🤖', '🎲', '🧱', '💾', '🏎️', '🎯', '🧩']
  }
};

export const DEFAULT_THEME_PACK = 'nature';

export function getThemePack(themeId) {
  return THEME_PACKS[themeId] || THEME_PACKS[DEFAULT_THEME_PACK];
}
