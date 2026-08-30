import { api } from "@/lib/api"
import type { Workspace, WorkspaceObject } from "./types";



class WorkspaceService {
    async getWorkspaces(): Promise<Workspace[]> {

        const response = await api.get("/workspaces")
        const { Workspaces } = response.data.data;

        return Workspaces

    }


    async getWorkspace(id: string) : Promise<Workspace> {
        const response = await api.get(`/workspace/${id}`)

        const { workspace } = response.data.data

        return workspace

    }

    async createWorkpace(data: WorkspaceObject) : Promise<Workspace>{
       const response =  await api.post("/workspace",data)
       return response.data.data
    }
 
     async deleteWorkspace(id : string) : Promise<void>{
        await api.delete(`/workspace/${id}`)
         
     }
}


export const workspaceService = new WorkspaceService()
