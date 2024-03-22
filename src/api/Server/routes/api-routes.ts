import Fluffici from "@fluffici.ts";
import AbstractRoutes from "../../Server/AbstractRoutes";
import {Request, Response} from "express";

export interface Statistics {
    guilds: number;
    users: number;
    commands: number;
}

export default class ApiRoutes extends AbstractRoutes {
    public selfRegister() {
        this.getRouter().get('/cmd', this.getCmdHandler.bind(this))
        this.getRouter().get('/invite', this.getInviteHandler.bind(this))
        this.getRouter().get('/stats', this.getStatsHandler.bind(this))
    }

    private async getCmdHandler(req: Request, res: Response) {
        const data = Fluffici.instance.manager.toList();
        this.sendSuccessResponse(res, data);
    }

    private async getInviteHandler(req: Request, res: Response) {
        const data = {
            invite_url: `https://discord.com/api/oauth2/authorize?client_id=${Fluffici.instance.application.id}&permissions=23427300781831&scope=bot`
        };
        this.sendSuccessResponse(res, data);
    }

    private async getStatsHandler(req: Request, res: Response) {
        const exists = await this.cacheManager.exists("statistics");

        if (exists) {
            const data = await this.cacheManager.getObject<Statistics>("statistics");
            const response = {
                metadata: {
                    objectId: data.objectId,
                    cachedAt: data.cachedAt,
                },
                data: data.data,
            };
            this.sendSuccessResponse(res, response);
        } else {
            const newStats = {
                guilds: Fluffici.instance.guilds.cache.size,
                users: Fluffici.instance.users.cache.size,
                commands: Fluffici.instance.manager.toList().length,
            };
            const result = await this.cacheManager.addObject<Statistics>("statistics", newStats, 300);
            this.sendSuccessResponse(res, result);
        }
    }
}
