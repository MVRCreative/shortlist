export type SavedCampaign = {
  id: string
  title: string
  objective: string
  supportingUrl: string
  createdAt: string
}

export type SavedAudience = {
  id: string
  name: string
  industries: string[]
  buyerTitles: string[]
  companySizes: string[]
  regions: string[]
  exampleCompanies: string[]
  createdAt: string
}

export type Library = {
  campaigns: SavedCampaign[]
  audiences: SavedAudience[]
}

const KEY = 'shortlist:library:v1'

export function loadLibrary(): Library {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { campaigns: [], audiences: [] }
    const parsed = JSON.parse(raw) as Partial<Library>
    return { campaigns: parsed.campaigns ?? [], audiences: parsed.audiences ?? [] }
  } catch {
    return { campaigns: [], audiences: [] }
  }
}

export function saveLibrary(library: Library) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(library))
  } catch {
    // Storage full or disabled: lists just won't survive a reload.
  }
}
