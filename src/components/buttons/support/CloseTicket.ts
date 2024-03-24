import BaseButton from "@fluffici.ts/components/BaseButton";
import {ButtonInteraction, MessageButton, MessageEmbed, TextChannel} from "discord.js";
import {MessageButtonStyles} from "discord.js/typings/enums";
import Ticket from "@fluffici.ts/database/Guild/Ticket";
import TicketMessage from "@fluffici.ts/database/Guild/TicketMessage";
import fs from "fs";
import path from "path";

export default class CloseTicket extends BaseButton<MessageButton, void> {

  public constructor() {
   super('row_support_ticket_close', 'Close ticket')
  }

  async handler(interaction: ButtonInteraction<"cached">): Promise<any> {
    await this.getGuild(interaction.guildId)

    const currentTicket = await Ticket.findOne({
      channelId: interaction.channelId,
      isClosed: false
    })

    if (currentTicket) {
      let contentArray = [];
      const messages = await TicketMessage.find({
        ticketId: currentTicket._id
      })
      messages.forEach(data => {
        contentArray.push(`${data.userId}: ${data.message}`);
      })

      try {
        if (contentArray.length > 0) {
          const filePath = path.join(__dirname, `transcripts/transcript-${currentTicket._id}.txt`);
          // Write transcription data to a .txt file
          fs.writeFile(filePath, contentArray.join('\n'), async (err) => {
            if (err) {
              console.error(err)
            } else {
              const uploadChannel = this.instance.channels.cache.get('606614204576825348') as TextChannel;
              await uploadChannel.send({
                embeds: [
                  {
                    title: 'FurRaidDB - New ticket closed',
                    description: 'The transcript has been generated.',
                    footer: {
                      text: `Ticket id ${currentTicket._id}`,
                      iconURL: this.instance.user.avatarURL({ format: 'png' })
                    },
                    timestamp: Date.now()
                  }
                ],
                files: [{
                  attachment: filePath,
                  name: `transcript-${currentTicket._id}.txt`
                }]
              });
            }
          });
        }
      } catch (e) {
        this.instance.logger.error(`Failed to transcript ${currentTicket._id} ticket's messages.`)
        this.instance.logger.error(e)
      }

      await interaction.channel.delete("Closing support ticket")
      await interaction.reply({
        content: 'Ticket closed.',
        ephemeral: true
      })
    } else {
      await interaction.reply({
        content: 'This is not a support ticket.',
        ephemeral: true
      })
    }
  }

  generate(): MessageButton {
    return new MessageButton()
      .setStyle(MessageButtonStyles.PRIMARY)
      .setLabel(this.description)
      .setEmoji(this.getEmojisConfig().get('close'))
      .setCustomId(this.customId);
  }

  message(): MessageEmbed {
    return new MessageEmbed();
  }
}
