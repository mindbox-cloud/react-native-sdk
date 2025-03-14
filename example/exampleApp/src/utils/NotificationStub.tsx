import { Notification } from './Notification'

const initialNotifications: Notification[] = [
  {
    uniqueKey: 'exampleUniqueKey1',
    title: 'Example Title 1',
    description: 'This is an example description for remote message 1.',
    imageUrl: 'https://mobpush-images.example.com/Mpush-test/1a73ebaa-3e5f-49f4-ae6c-462c9b64d34c/307be696-77e6-4d83-b7eb-c94be85f7a03.png',
    pushLink: 'http://example.com/1',
    pushName: 'Push name 1',
    pushDate: 'Push date 1',
  },
  {
    uniqueKey: 'exampleUniqueKey2',
    title: 'Example Title 2',
    description: 'This is an example description for remote message 2.',
    imageUrl: 'https://mobpush-images.example.com/Mpush-test/1a73ebaa-3e5f-49f4-ae6c-462c9b64d34c/2397fea9-383d-49bf-a6a0-181a267faa94.png',
    pushLink: 'http://example.com/2',
    pushName: 'Push name 2',
    pushDate: 'Push date 2',
  },
  {
    uniqueKey: 'exampleUniqueKey3',
    title: 'Example Title 3',
    description: 'This is an example description for remote message 3.',
    imageUrl: 'https://mobpush-images.example.com/Mpush-test/1a73ebaa-3e5f-49f4-ae6c-462c9b64d34c/bd4250b1-a7ac-4b8a-b91b-481b3b5c565c.png',
    pushLink: 'http://example.com/3',
    pushName: 'Push name 3',
    pushDate: 'Push date 3',
  },
]

export default initialNotifications
