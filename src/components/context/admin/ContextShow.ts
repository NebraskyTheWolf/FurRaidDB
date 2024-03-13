import BaseContextMenu from "@fluffici.ts/components/BaseContextMenu";
import {ContextMenuInteraction, Guild, GuildMember} from "discord.js";
import OptionMap from "@fluffici.ts/utils/OptionMap";

export default class ContextShow extends BaseContextMenu {

  public constructor() {
    super("Lookup", new OptionMap<string, boolean>().add("isProtected", true));
  }

  async handler(inter: ContextMenuInteraction<"cached">, member: GuildMember, guild: Guild): Promise<boolean> {

      return false;
  }

}
