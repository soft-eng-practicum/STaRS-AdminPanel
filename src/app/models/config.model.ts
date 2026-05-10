interface Config {
    name: string,
    configName: string,
    logo?: string,
    judgesDB: string,
    postersDB: string,
    feedbackLink?: string,
    secret: string
}

interface MetaConfig {
    configs: Config[],
    activeConfigName: string,
    _id: "meta-config",
    _rev: string
}