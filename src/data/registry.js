import {era} from './era.js';
import {events} from './events.js';
import {minigame} from './minigame.js';
import {entries} from './collection.js';
import {historyEvents,backgroundTopics} from './history.js';
import {peopleTemplates,birthEnvironments,traitLabels} from './people.js';
import {challengeDefinitions} from './challenges.js';
import {meals} from './meals.js';
import {economyRules} from './economy.js';
// Register future era bundles here. Only Edo is selectable in this MVP.
export const eras = Object.freeze({[era.id]:{era,events,minigame,entries,historyEvents,backgroundTopics,peopleTemplates,birthEnvironments,traitLabels,challengeDefinitions,meals,economyRules}});
export const ACTIVE_ERA_ID = 'edo-nihonbashi';
export const {era:activeEra,events:activeEvents,minigame:activeMinigame,entries:activeEntries,historyEvents:activeHistory,backgroundTopics:activeBackground,peopleTemplates:activePeople,birthEnvironments:activeBirthEnvironments,traitLabels:activeTraits,challengeDefinitions:activeChallenges,meals:activeMeals,economyRules:activeEconomy}=eras[ACTIVE_ERA_ID];
