import BaseButton from "@fluffici.ts/components/BaseButton";
import {
    ButtonInteraction,
    MessageButton,
    MessageEmbed
} from "discord.js";
import ModalHelper from "@fluffici.ts/utils/ModalHelper";
import {
    TextInputComponent
} from "discord-modals";
import Verification from "@fluffici.ts/database/Guild/Verification";

export default class ButtonVerify extends BaseButton<MessageButton, void> {
    public constructor() {
        super("row_verify", "Ověření");
    }

    public async handler(inter: ButtonInteraction<"cached">): Promise<void> {
      await this.getGuild(inter.guildId)

      const isPending = await Verification.findOne({
        memberId: inter.member.id,
        status: 'pending'
      });

      if (isPending) {
        return await inter.reply({
          content: 'You cannot do this, you already sent your request.',
          ephemeral: true
        })
      }

      await new ModalHelper(
        "row_verification_submit",
        "Ověřte se pro přístup do serveru"
      ).addTextInput(
        new TextInputComponent()
          .setCustomId("row_verification_answer_one")
          .setStyle("LONG")
          .setLabel("Jste furry? Pokud ano, popište svoji fursonu: ")
          .setMinLength(2)
          .setMaxLength(500)
          .setPlaceholder("Stručně popište svoji sonu, či uveďte Ne, pokud žádnou nemáte.")
          .setRequired(true)
      ).addTextInput(
        new TextInputComponent()
          .setCustomId("row_verification_answer_two")
          .setStyle("LONG")
          .setLabel("Napište pár slov o sobě:")
          .setMinLength(2)
          .setMaxLength(500)
          .setPlaceholder("Jaké jsou vaše zájmy a koníčky? Co děláte ve volném čase? Jaká je vaše povaha?")
          .setRequired(true)
      ).addTextInput(
        new TextInputComponent()
          .setCustomId("row_verification_answer_three")
          .setStyle("LONG")
          .setLabel("Jaký máte vztah k furry komunitě?")
          .setMinLength(2)
          .setMaxLength(500)
          .setPlaceholder("Jak dlouho jste součástí komunity, jak jí vnímáte, atd.?")
          .setRequired(true)
      ).addTextInput(
        new TextInputComponent()
          .setCustomId("row_verification_answer_four")
          .setStyle("LONG")
          .setLabel("Jak jste našli náš server?")
          .setMinLength(2)
          .setMaxLength(500)
          .setPlaceholder("Pokud od někoho, sdělte nám prosím jeho Discord přezdívku")
          .setRequired(true)
      ).generate(inter);
    }

    public generate(): MessageButton {
        return new MessageButton()
            .setCustomId(this.customId)
            .setLabel(this.description)
            .setStyle("PRIMARY")
            .setEmoji(this.getEmojisConfig().get("verify"));
    }

    public message(): MessageEmbed {
        return new MessageEmbed()
            .setColor("GREEN")
            .setDescription("## Základní informace\n" +
              "**Vítej na našem serveru! Pro přístup se nejprve musíš ověřit.**\n" +
              "* Jsi na Discordovém serveru komunity Fluffíci. Naším cílem je poskytnout prostory pro socializaci a možnost poznat nové lidi v rámci českého a slovenského furry fandomu. Pořádáme akce pro Fluffíci, z.s., organizujeme eventy na serveru (například filmové večery, hraní her, kreslení atd.) a také je zde prostor pro obyčejný pokec.\n" +
              "* Server je kompletně SFW. Cokoliv, co do této kategorie nespadá, zde není tolerováno.\n" +
              "* Minimální věk dle pravidel platformy Discord je 15 let v ČR a 16 let v SR.\n" +
              "* Trollové, raideři a jiné osoby s obdobnými záměry nejsou vítáni.\n" +
              "## Jak se ověřit?\n" +
              "** Kliknutím na tlačítko 'Ověření' pod tímto oknem zahájíš verifikaci.**\n" +
              "* Během verifikace budeš odkázán/a na pravidla serveru, které je třeba si projít a odsouhlasit.\n" +
              "* Abychom se přesvědčili, že nemáš nekalé úmysly, je potřeba alespoň stručně odpovědět na několik otázek. Snaž se odepisovat konkrétně a stručně.\n" +
              "* Po odeslání žádosti o ověření vyčkej, než moderátorský tým zkontroluje tvoji žádost. Doba čekání je obvykle do hodiny, max během několika hodin v závislosti na čase odeslání žádosti.\n" +
              "* Nebude-li tvoje žádost dostatečně adekvátní či až příliš stručná, bude zamítnuta. V případě zamítnutí máš možnost odeslat novou žádost.\n" +
              "* Kdyby cokoliv nebylo jasné, využij možnost ticketu."
            )
    }
}
