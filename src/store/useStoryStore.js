'use client'

import { create } from 'zustand'

const STORY_SETTINGS = [
  'A medieval fantasy world with magic and dragons',
  'A futuristic cyberpunk city with advanced technology',
  'A post-apocalyptic wasteland with mutated creatures',
  'A peaceful village in a magical forest',
  'A space station orbiting a distant planet',
  'A haunted mansion with dark secrets',
  'A pirate ship sailing the seven seas',
  'A hidden underground city of dwarves',
  'A floating island in the sky',
  'A time-traveling adventure through different eras',
]

const STORY_TONES = [
  'Lighthearted and humorous',
  'Dark and mysterious',
  'Epic and grand',
  'Intimate and personal',
  'Suspenseful and thrilling',
  'Philosophical and thought-provoking',
  'Romantic and emotional',
  'Action-packed and fast-paced',
  'Whimsical and magical',
  'Realistic and grounded',
]

const READABILITY_LEVELS = [
  {
    level: 1,
    label: 'Very Easy',
    description: 'Simple language, short sentences',
  },
  {
    level: 2,
    label: 'Easy',
    description:
      'Basic vocabulary, straightforward narrative',
  },
  {
    level: 3,
    label: 'Moderate',
    description: 'Standard language, some complex ideas',
  },
  {
    level: 4,
    label: 'Advanced',
    description: 'Rich vocabulary, complex themes',
  },
  {
    level: 5,
    label: 'Expert',
    description: 'Sophisticated language, deep themes',
  },
]

const CHARACTERS = [
  {
    id: 1,
    name: 'Gerardo',
    image: '/assets/gerardo.png',
    description:
      'A mysterious figure with a penchant for technology and innovation.',
    selected: false,
  },
  {
    id: 2,
    name: 'Philip',
    image: '/assets/philip.png',
    description:
      'A strategic thinker with a calm demeanor and sharp intellect.',
    selected: false,
  },
  {
    id: 3,
    name: 'Steve',
    image: '/assets/steve.png',
    description:
      'A visionary leader with a passion for design and user experience.',
    selected: false,
  },
  {
    id: 4,
    name: 'Biden',
    image: '/assets/biden.png',
    description:
      'A seasoned politician with years of experience in leadership.',
    selected: false,
  },
  {
    id: 5,
    name: 'Trump',
    image: '/assets/trump.png',
    description:
      'A charismatic businessman with a flair for the dramatic.',
    selected: false,
  },
  {
    id: 6,
    name: 'Dennis',
    image: '/assets/dennis.png',
    description:
      'A creative mind with a unique perspective on problem-solving.',
    selected: false,
  },
  {
    id: 7,
    name: 'Ami',
    image: '/assets/ami.png',
    description:
      'A compassionate individual with a strong sense of community.',
    selected: false,
  },
]

export const useStoryStore = create((set) => ({
  currentPage: 0,
  totalPages: 3,
  storySettings: {
    setting: '',
    isCustom: true,
    tone: '',
    readability: 3,
  },
  characters: CHARACTERS,
  importedStoryState: null,

  // For storing story progress
  storyChapters: [],
  generatedContent: null,
  currentChapter: 1,

  // Navigation
  nextPage: () =>
    set((state) => ({
      currentPage: Math.min(
        state.currentPage + 1,
        state.totalPages - 1
      ),
    })),
  prevPage: () =>
    set((state) => ({
      currentPage: Math.max(state.currentPage - 1, 0),
    })),

  // Story settings actions
  setStorySetting: (setting) =>
    set({
      storySettings: {
        ...useStoryStore.getState().storySettings,
        setting,
        isCustom: true,
      },
    }),
  setRandomSetting: () =>
    set({
      storySettings: {
        ...useStoryStore.getState().storySettings,
        setting:
          STORY_SETTINGS[
            Math.floor(
              Math.random() * STORY_SETTINGS.length
            )
          ],
        isCustom: false,
      },
    }),
  setStoryTone: (tone) =>
    set({
      storySettings: {
        ...useStoryStore.getState().storySettings,
        tone,
      },
    }),
  setReadability: (level) =>
    set({
      storySettings: {
        ...useStoryStore.getState().storySettings,
        readability: level,
      },
    }),

  // Character selection actions
  toggleCharacter: (id) =>
    set((state) => ({
      characters: state.characters.map((char) =>
        char.id === id
          ? { ...char, selected: !char.selected }
          : char
      ),
    })),

  // Import story state - directly set all relevant state properties
  setImportedState: (storyState) =>
    set({
      importedStoryState: storyState,
      storyChapters: storyState.storyChapters || [],
      generatedContent: storyState.generatedContent || null,
      currentChapter:
        storyState.currentChapter ||
        storyState.storyChapters?.length ||
        1,
      storySettings:
        storyState.storySettings ||
        useStoryStore.getState().storySettings,
      characters:
        storyState.characters ||
        useStoryStore.getState().characters,
    }),

  // Clear story state
  clearStoryState: () =>
    set({
      storyChapters: [],
      generatedContent: null,
      currentChapter: 1,
    }),

  // Validation
  canProceed: () => {
    const state = useStoryStore.getState()
    if (state.currentPage === 0) {
      return (
        state.storySettings.setting.trim().length > 0 &&
        state.storySettings.tone.trim().length > 0
      )
    }
    if (state.currentPage === 1) {
      return state.characters.some((char) => char.selected)
    }
    return true
  },
}))
