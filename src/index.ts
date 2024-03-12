import * as dotenv from "dotenv";

dotenv.config()

import 'module-alias/register';
import { Client, Intents } from "discord.js";
import mongoose from "mongoose";

import CommandManager from "./components/commands/CommandManager";
import ButtonManager from "./components/buttons/ButtonManager";
import EventManager from "./events/EventManager";
import discordModals from "discord-modals";

import Logger from "@fluffici.ts/logger";
import InitChecker from '@fluffici.ts/utils/InitChecker';

export default class Fluffici extends Client {
    public static instance: Fluffici

    public database: mongoose.Mongoose

    public readonly logger: Logger
    public readonly checker: InitChecker

    public manager: CommandManager
    public eventManager: EventManager
    public buttonManager: ButtonManager
    public loaded: boolean = false

    public readonly version: string = process.env.VERSION || "Unreferenced version."
    public readonly revision: string = process.env.REVISION || "Unreferenced revision code."

    public constructor () {
      super({
        partials: ["MESSAGE", "USER", "REACTION"],
        intents: [
          Intents.FLAGS.GUILDS,
          Intents.FLAGS.GUILD_MEMBERS,
          Intents.FLAGS.GUILD_PRESENCES
        ]
      })
      Fluffici.instance = this
      this.logger = new Logger("Fluffici")
      this.checker = new InitChecker()

      this.setupErrorHandling()
      this.doInitialCheckOrStart()
    }

    private setupErrorHandling (): void {
      process.on('uncaughtException', function (error) {
        Fluffici.instance.logger.error("Stacktrace: " + error.stack)
        Fluffici.instance.logger.error("\n");
      });

      process.on('unhandledRejection', function (error) {
        Fluffici.instance.logger.error("Stacktrace: " + error)
        Fluffici.instance.logger.error("\n")
      });
    }

    private doInitialCheckOrStart (): void {
      if (this.checker.init())
        this.logger.error('  -> Process aborted.')
      else
        this.start()
    }

    private async start () {
      this.logSystemInfo();
      this.connectToDBAndLoad();
    }

    private logSystemInfo (): void {
      this.logger.info("Loading system...")
      this.logger.info(`Version: ${this.version}`)
      this.logger.info(`Revision: ${this.revision}`)
    }

    private connectToDBAndLoad (): void {
      this.logger.info("Connecting to MongoDB")
      mongoose.connect(process.env.MONGODB, {}).then(db => {
        this.database = db;
        this.logger.info("Connected to MongoDB.");
        this.load();
      }).catch(err => { this.logger.warn("Failed to contact the database.") });

      this.load()
    }

    private load() {
      discordModals(this);

      this.logger.info("Loading system...")

      this.manager = new CommandManager()
      this.manager.registerCommands()

      this.eventManager = new EventManager()
      this.eventManager.registerEvents()

      this.buttonManager = new ButtonManager()
      this.buttonManager.registerButtons()

      this.login(process.env.TOKEN)
    }

    public reload () {
      this.logger.info("Reloading components...")
      this.manager.reload()
      this.buttonManager.reload()
    }

    public static getInstance (): Fluffici {
      return this.instance
    }
}

export const fluffici: Fluffici = new Fluffici()
