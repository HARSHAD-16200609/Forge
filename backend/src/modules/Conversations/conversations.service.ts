import { BadGatewayError, BadRequestError, ConfilctError, NotFoundError } from "../../utility/errorHandling/customErrors"
import { authRepository } from "../Auth/auth.repository"
import { conversationRepository } from "./conversations.repository"

class ConversationService {
    async createDM(senderId: string, receiverId: string) {

        if (senderId === receiverId) throw new BadRequestError("You can't create an Dm with self")
        const receiver = await authRepository.getById(receiverId)
        if (!receiver) throw new NotFoundError("No such User Exist's")
        const existingDM = await conversationRepository.findDMBetweenUsers(senderId, receiverId)

        if (existingDM && existingDM._count.members === 2) return existingDM

        const dm = await conversationRepository.createDM(senderId, receiverId)

        return dm
    }
}

export const conversationService = new ConversationService()