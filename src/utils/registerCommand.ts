import Fluffici from "@fluffici.ts";
import BaseCommand from "@fluffici.ts/components/BaseCommand";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { Client, Snowflake } from "discord.js";
import CommandManager from "../components/commands/CommandManager";
import BaseContextMenu from "@fluffici.ts/components/BaseContextMenu";

export function deleteCommand() {
    Fluffici.instance.application.commands.cache.forEach(async command => {
        await removeApplicationCommands(command.id)
    })
}

export async function removeApplicationCommands(commandId: Snowflake) {
    try {
        const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

        await rest.delete(
            Routes.applicationCommand(Fluffici.instance.user.id, commandId)
        )
    } catch(error) {
        console.log(`Delete command error on ${commandId}`)
        console.log(error)
    }
}

export async function registerCommands(
  client: Client,
  guildId: string,
  guildName: string,
  commandManager: CommandManager) {
  try {
    const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);
    const commandData = commandManager.toMap().map((getData: BaseCommand) => {
      return getData.getCommand();
    });


    await rest.put(
      Routes.applicationGuildCommands(client.user?.id || "missing id", guildId),
      { body: commandData }
    );

  } catch (error) {
    if (error.rawError?.code === 50001) {
      console.log(`Missing Access on server "${guildName}"`)
      return
    }
    console.log(`Register command error on ${guildId}`)
    console.log(error)
  }
}

export async function registerAppContext() {
  try {
    const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

    const commandData = Fluffici.instance.contextMenuManager.toMap().map((getData: BaseContextMenu) => {
      return getData.getCommand().toJSON();
    });

    await rest.put(Routes.applicationCommands(Fluffici.instance.user.id), { body: commandData });

  } catch (error) {
    if (error.rawError?.code === 50001) {
      console.log(`Missing Access"`)
      return
    }
    console.log(`Register context error`)
    console.log(error)
  }
}
