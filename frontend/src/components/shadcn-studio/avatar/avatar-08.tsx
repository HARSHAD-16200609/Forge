import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckIcon } from "lucide-react"

const AvatarStatusRingDemo = () => {
  return (
    <Avatar className='ring-offset-background ring-2 ring-green-600 ring-offset-2 dark:ring-green-400'>
      <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png' alt='Hallie Richards' />
      <AvatarFallback>HR</AvatarFallback>
      <AvatarBadge className='-right-1.5 -bottom-1.5 bg-green-600 ring-0 group-data-[size=default]/avatar:size-4 dark:bg-green-400 group-data-[size=default]/avatar:[&>svg]:size-3'>
        <CheckIcon className='text-white' />
      </AvatarBadge>
    </Avatar>
  )
}

export default AvatarStatusRingDemo
