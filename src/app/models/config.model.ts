import { META_CONFIG_ID } from "../services/pouchdb.service"

export interface Config {
    name?: string,
    configName: string,
    logo?: string,
    judgesDB: string,
    postersDB: string,
    feedbackLink?: string,
    secret: string
}

export interface MetaConfig {
    configs: Config[],
    activeConfigName: string,
    _id: typeof META_CONFIG_ID,
    _rev: string
}