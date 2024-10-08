import Logger from '@fluffici.ts/logger'
import BaseCommand from '@fluffici.ts/components/BaseCommand'
import OptionMap from '@fluffici.ts/utils/OptionMap'
import { deleteCommand } from '@fluffici.ts/utils/registerCommand'
import { Collection } from 'discord.js'

import CommandSet from "./admin/CommandSet";
import CommandShow from "./admin/CommandShow";
import CommandHelp from "./default/CommandHelp";
import CommandInvite from "./default/CommandInvite";
import CommandSupport from "./default/CommandSupport";
import CommandGlobal from "./moderation/CommandGlobal";
import CommandWhitelist from "./moderation/CommandWhitelist";
import CommandReload from "./owner/CommandReload";
import CommandServers from "./owner/CommandServers";
import CommandLocal from "./moderation/CommandLocal";
import CommandSpawnButton from "./owner/CommandSpawnButton";
import ForceResync from "./owner/ForceResync";
import CommandEval from "./owner/CommandEval";
import DisableSpamProtection from "./owner/DisableSpamProtection";
import CommandTicket from "./admin/CommandTicket";
import TicketForceClose from "./owner/TicketForceClose";
import CommandFindDuplicates from "./owner/CommandFindDuplicates";
import CommandReminderDBG from "./owner/CommandReminderDBG";
import CommandReminderUnlock from "./owner/CommandReminderUnlock";
import CommandReminderDeleteUser from "./owner/CommandReminderDeleteUser";
import CommandVerification from "./admin/CommandVerification";

export default class CommandManager {
  private REGISTRY: OptionMap<String, BaseCommand>;
  private logger: Logger;

  public readonly groups: OptionMap<String, String> = new OptionMap<String, String>()

  public constructor () {
    this.REGISTRY = new OptionMap<String, BaseCommand>();
    this.logger = new Logger("CommandRegistry");

    this.groups.add("ADMINISTRATOR", "Admin & Staff")
    this.groups.add("MODERATION", "Moderation commands")
    this.groups.add("DEFAULT", "Default commands")
    this.groups.add("OWNER", "Developer")
  }

  public registerCommands (): void {
    this.registerCommand(new CommandSet())
    this.registerCommand(new CommandShow())

    this.registerCommand(new CommandHelp())
    this.registerCommand(new CommandInvite())
    this.registerCommand(new CommandSupport())
    this.registerCommand(new CommandTicket())
    this.registerCommand(new CommandVerification())

    this.registerCommand(new CommandGlobal())
    this.registerCommand(new CommandLocal())
    this.registerCommand(new CommandWhitelist())

    this.registerCommand(new CommandReload())
    this.registerCommand(new CommandServers())
    this.registerCommand(new CommandSpawnButton())
    this.registerCommand(new ForceResync())
    this.registerCommand(new CommandEval())
    this.registerCommand(new DisableSpamProtection())
    this.registerCommand(new TicketForceClose())
    this.registerCommand(new CommandFindDuplicates())
    this.registerCommand(new CommandReminderDBG())
    this.registerCommand(new CommandReminderUnlock())
    this.registerCommand(new CommandReminderDeleteUser())

  }

  /**
   * Registers a command in the command registry.
   *
   * @param {BaseCommand} base - The base command to register.
   *
   * @throws {Error} If the command with the same name is already registered.
   *
   * @returns {void}
   */
  public registerCommand (base: BaseCommand): void {
    if (this.REGISTRY.getMap().has(base.name))
      throw new Error("You can't register the same command at once.");
    if (base.options.get("isDisabled")) {
      this.logger.warn(`${base.name} is disabled.`);
    } else {
      if (this.REGISTRY.has(base.name)) {
        this.logger.warn(`Command ${base.name} is already registered. Overwriting it.`);
      }

      this.REGISTRY.add(base.name, base);
      this.logger.info(`Command ${base.name} is now registered.`);
    }
  }

  public getCommand (name: string): BaseCommand {
    return this.REGISTRY.get(name);
  }

  public removeCommand (name: string): Boolean {
    this.logger.warn(`The handler of ${name} is now deleted.`);
    return this.REGISTRY.remove(name);
  }

  public reload () {
    this.REGISTRY.getMap().clear();
    deleteCommand();
    this.registerCommands();
  }

  public toMap(): Collection<String, BaseCommand> {
    return this.REGISTRY.getMap();
  }


  public toList () {
    return this.REGISTRY.getMap().map((value: BaseCommand) => {
      return {
        name: value.name,
        description: value.description || '',
        category: value.getCategory(),
        type: value.type,
        options: value.getArgs() || []
      }
    })
  }
}
