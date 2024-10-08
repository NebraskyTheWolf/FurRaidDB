import Blacklist from '@fluffici.ts/database/Common/Blacklist'
import LocalBlacklist from '@fluffici.ts/database/Common/LocalBlacklist'
import { Guild as FGuild } from '@fluffici.ts/database/Guild/Guild'
import BaseCommand from '@fluffici.ts/components/BaseCommand'
import OptionMap from '@fluffici.ts/utils/OptionMap'
import {
  fetchMember,
  getCurrentDate,
  isBotOrSystem,
} from '@fluffici.ts/types'

import { CommandInteraction, Guild, GuildMember, User } from 'discord.js'
import {
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
  SlashCommandUserOption
} from '@discordjs/builders'

export default class CommandLocal extends BaseCommand {

  public constructor () {
    super("local", "This command will let you blacklist someone locally.", new OptionMap<string, boolean>().add('isProtected', true), 'MODERATION')

    this.addSubCommand(
      new SlashCommandSubcommandBuilder()
        .setName("add")
        .setDescription("Add a user to the global blacklist.")
        .addUserOption(
          new SlashCommandUserOption()
            .setName("user")
            .setDescription("Select a user")
            .setRequired(true)
        )
        .addStringOption(
          new SlashCommandStringOption()
            .setName("reason")
            .setDescription("Set a reason for the blacklist.")
            .setRequired(true)
        )
    )

    this.addSubCommand(
      new SlashCommandSubcommandBuilder()
        .setName("remove")
        .setDescription("Remove a user from the global blacklist.")
        .addUserOption(
          new SlashCommandUserOption()
            .setName("user")
            .setDescription("Select a user")
            .setRequired(true)
        )
    )
  }

  async handler (inter: CommandInteraction<'cached'>, member: GuildMember, guild: Guild) {
    const fGuild = await this.getGuild(guild.id)

    const command = inter.options.getSubcommand()

    return await this.handleLocalCommand(inter, command, fGuild)
  }

  async handleLocalCommand (inter: CommandInteraction<'cached'>, command: string, guild: FGuild) {
    const user = inter.options.getUser('user', true)

    switch (command) {
      case 'add': {
        const reason = inter.options.getString('reason', true)
        const member = await fetchMember(inter.guildId, user.id)
        const local = await this.findLocal(user, inter.guildId)

        if (local) {
          return await this.respond(inter, 'command.blacklist.user_already_blacklisted_title', 'command.blacklist.user_already_blacklisted_description', 'RED', { user: user.tag }, 'error')
        }

        await this.handleLog(guild, inter, user, 'add', 'local')
        this.writeAuditLog(guild.guildID, inter.member.id, "local_blacklist_added", `Blacklisted ${user.id} reason ${reason} locally`)

        return await this.addMemberToBlacklist(inter, user, reason, member)
      }
      case 'remove': {
        const local = await this.findLocal(user, inter.guildId)
        if (!local) {
          return await this.respond(inter, 'command.blacklist.user_not_blacklisted_title', 'command.blacklist.user_not_blacklisted_description', 'RED', { user: user.tag }, 'error')
        }

        await this.handleLog(guild, inter, user, 'remove', 'local')
        this.writeAuditLog(guild.guildID, inter.member.id, "local_blacklist_removed", `Unblacklisted ${user.id}`)

        return await this.removeMemberFromBlacklist(inter, user)
      }
    }
  }

  async findLocal (user: User, guildId: string) {
    return LocalBlacklist.findOne({
      guildId: guildId,
      userID: user.id
    })
  }

  async addMemberToBlacklist (inter: CommandInteraction<"cached">, user: User, reason: string, member: GuildMember) {
    await new LocalBlacklist({
      guildId: inter.guildId,
      userID: user.id,
      reason: reason,
      staff: inter.member.id,
      date: getCurrentDate()
    }).save()

    await this.respond(inter, 'command.blacklist.user_blacklisted_title', 'command.blacklist.user_blacklisted_description', 'GREEN', { user: user.tag })
    if (member) {
      // Ban if the user exists, otherwise we skip.
      // FIX: F-0007-2024
      await member.ban({ reason: reason })
    }
  }

  async removeMemberFromBlacklist (inter: CommandInteraction<'cached'>, user: User) {
    await LocalBlacklist.deleteOne({
      guildId: inter.guildId,
      userID: user.id
    })

    await this.respond(inter, 'command.blacklist.user_unblacklisted_title', 'command.blacklist.user_unblacklisted_description', 'GREEN', { user: user.tag })
  }

  async respond (inter: CommandInteraction<"cached">, titleKey: string, descKey: string, color: string, args = {}, icon: string = 'success') {
    await inter.reply({
      embeds: this.buildEmbedMessage(inter.member, {
        icon: icon,
        color: color,
        title: this.getLanguageManager().translate(titleKey, args),
        description: this.getLanguageManager().translate(descKey, args)
      }),
      ephemeral: true
    })
  }

  async handleLog(guild: FGuild, inter: CommandInteraction<'cached'>, user: User, type: string, log: string) {
    await this.sendLog(guild, await fetchMember(guild.guildID, user.id), (type === "add" ? 'ban' : 'info'), this.getLanguageManager().translate('command.blacklist.' + type + '.log.' + log + '.title', { user: user.tag }),
      this.getLanguageManager().translate('command.blacklist.' + type + '.log.' + log + '.description'), 'RED',
      this.generateLogDetails(
        await fetchMember(guild.guildID, user.id),
        await Blacklist.findOne({ userID: user.id }),
        await LocalBlacklist.findOne({ userID: user.id, guildID: inter.guildId })
      ));
  }
}
