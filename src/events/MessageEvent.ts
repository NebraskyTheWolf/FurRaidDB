import BaseEvent from "@fluffici.ts/components/BaseEvent";
import { Guild as FGuild } from "@fluffici.ts/database/Guild/Guild";
import fetch from "node-fetch";
import {Message, TextChannel} from "discord.js";
import { registerCommands } from "@fluffici.ts/utils/registerCommand";
import Migrated, { IMigrated } from "@fluffici.ts/database/Security/Migrated";
import { isBotOrSystem } from "@fluffici.ts/types";
import Ticket from "@fluffici.ts/database/Guild/Ticket";
import TicketMessage from "@fluffici.ts/database/Guild/TicketMessage";

interface Offence {
  timestamp: number;
  count: number;
  lastMessageHits: number;
  lastMessage?: string;
  lastMessageTimestamp?: number;
  repeatedMessages: Set<string>;
}

export default class MessageEvent extends BaseEvent {
  private messageTimePeriod: number = 10000;

  public constructor() {
    super('messageCreate', async (message: Message) => {
      if (isBotOrSystem(message.member)) return;

      const guild = await this.getGuild(message.guildId);

      if (message.content.indexOf('frdb!') !== -1) {
        await this.handleMigrationCommand(message);
      }

      try {
        await this.handleTicketMessage(message);
      } catch (e) {
        this.instance.logger.error(e);
      }

      try {
        if (guild.scamLinks) {
          await this.handleScamLinks(message, guild);
        }
      } catch (e) {
        this.instance.logger.error(e);
      }
    });
  }

  private async handleTicketMessage(message: Message) {
    if (message.channel.type === 'GUILD_TEXT') {
      const channel = message.channel as TextChannel;
      const guild = channel.guild;
      const member = guild.members.cache.get(message.author.id);
      if (member) {
        const isTicket = await Ticket.findOne({
          channelId: channel.id,
          isClosed: false
        });
        if (isTicket) {
          await new TicketMessage({
            ticketId: isTicket._id,
            userId: member.id,
            message: message.content
          }).save();
        }
      }
    }
  }

  private async handleMigrationCommand(message: Message): Promise<void> {
    if (message.member.permissions.has('ADMINISTRATOR')) {
      const migrate: IMigrated = await Migrated.findOne({ guildId: message.guildId });
      if (migrate) {
        await message.reply({
          content: this.getLanguageManager().translate('event.already_migrated')
        });
      } else {
        await registerCommands(
          this.instance,
          message.guild.id,
          message.guild.name,
          this.instance.manager
        );
        await message.reply({
          content: this.getLanguageManager().translate('event.transition')
        });
        await new Migrated({
          guildId: message.guildId
        }).save();
      }
    }
  }

  private async handleScamLinks(message: Message, guild: FGuild): Promise<void> {
    if (message.content.indexOf('https://') !== -1 || message.content.indexOf('http://') !== -1) {
      const urls = this.extractUrls(message.content);
      for (const url of urls) {
        const scamUrl = await this.findScamUrl(url);
        if (scamUrl) {
          await this.handleScam(guild, message, scamUrl);
        }
      }
    }
  }

  private async findScamUrl(url: string): Promise<string | null> {
    const res = await this.callScamDetection(url);
    return res.scam ? url : null;
  }

  private async callScamDetection(url: string): Promise<any> {
    const apiUrl = `${this.getDefaultConfig().get('fluffici-api')}/api/moderation/scam-detection/link?link=${url}`;
    const response = await fetch(apiUrl, {
      method: 'GET'
    });
    if (!response.ok) throw new Error('Failed to fetch data');
    return response.json();
  }

  private async handleScam(guild: FGuild, message: Message, scamUrl: string, muted: boolean = false, offence: Offence = null): Promise<void> {
    await message.reply({
      content: this.getLanguageManager().translate('event.message.scam_detected')
    }).then(m => setTimeout(() => m.delete(), 10 * 1000));
    await message.delete();

    const logDetails = [
      {
        name: `Scam url:`,
        value: `${scamUrl}`,
        inline: false
      },
      {
        name: `ID:`,
        value: `${message.author.id}`,
        inline: false
      },
      {
        name: `Username:`,
        value: `${message.author.displayName}`,
        inline: false
      }
    ];

    if (muted) {
      logDetails.push(
        {
          name: this.getLanguageManager().translate('common.reason'),
          value: `Spamming of scam-links Strikes (${offence.count})/5`,
          inline: false
        }
      );
    }

    const title = muted ? this.getLanguageManager().translate('event.message.log.title.muted') : this.getLanguageManager().translate('event.message.log.title');
    const desc = this.getLanguageManager().translate('event.message.log.description');

    await this.sendScamLog(guild, message, title, desc, logDetails);
  }

  private async takeAction(message: Message, guild: FGuild, offence: Offence, reason: string) {
    await message.reply({ content: `${this.getLanguageManager().translate("common.dont.spam")}` });
    await message.member.timeout(60 * 1000, reason);

    await this.handleSpamLog(guild, message, offence, reason === "spamming");
  }

  private async handleSpamLog(guild: FGuild, message: Message, offence: Offence, isEveryone: boolean = false) {
    const logDetails = [
      {
        name: `${isEveryone ? '[Spam of @ everyone]' : '[Message spamming]'}`,
        value: this.getLanguageManager().translate(isEveryone ? "event.message.spam.detected.everyone" : "event.message.spam.detected", {
          messages: `${offence.count}`,
          ratelimit: `${this.messageTimePeriod / 1000}`
        }),
        inline: false
      },
      {
        name: `ID:`,
        value: `${message.author.id}`,
        inline: false
      },
      {
        name: `Username:`,
        value: `${message.author.displayName}`,
        inline: false
      }
    ];

    const title = this.getLanguageManager().translate('event.message.log.title.spam', {
      id: message.author.id
    });
    await this.sendScamLog(guild, message, title, 'blep', logDetails);
  }

  private extractUrls(text: string): string[] {
    let urls: string[] = [];
    const urlPattern = /((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/g;
    let match: string[];
    while ((match = urlPattern.exec(text)) !== null) {
      urls.push(match[0].replace(/https?:\/\//, '').replace('/', '').replace(')', ''));
    }
    return urls;
  }
}
