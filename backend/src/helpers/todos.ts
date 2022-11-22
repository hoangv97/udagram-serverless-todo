import * as uuid from 'uuid';
import { TodoItem } from '../models/TodoItem';
import { CreateTodoRequest } from '../requests/CreateTodoRequest';
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
import { createLogger } from '../utils/logger';
import { AttachmentUtils } from './attachmentUtils';
import { TodosAccess } from './todosAcess';

// /TODO: Implement businessLogic
const todoAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()

const logger = createLogger('todos')

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
  logger.info('get todos for user', userId)
  const items = await todoAccess.getAllTodos(userId)

  for (let item of items) {
    if (!!item['attachmentUrl'])
      item['attachmentUrl'] = attachmentUtils.getDownloadUrl(item['attachmentUrl'])
  }

  return items
}

export async function createTodo(
  userId: string,
  createTodoRequest: CreateTodoRequest,
): Promise<TodoItem> {
  logger.info('create todo for user', userId)
  const todoId = uuid.v4()

  return await todoAccess.createTodo({
    userId,
    todoId,
    createdAt: new Date().toISOString(),
    ...createTodoRequest
  } as TodoItem)
}

export async function deleteTodo(userId: string, todoId: string): Promise<void> {
  logger.info('delete todo', todoId)
  // Delete attachment object from S3
  await attachmentUtils.deleteAttachment(todoId)
  await todoAccess.deleteTodo(userId, todoId)
}

export async function updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest): Promise<void> {
  const validTodo = await todoAccess.getTodo(userId, todoId)

  if (!validTodo) {
    throw new Error('404')
  }

  return await todoAccess.updateTodo(userId, todoId, updatedTodo)
}


export async function createAttachmentPresignedUrl(userId: string, todoId: string): Promise<string> {
  logger.info('create attachment url', todoId)
  const validTodo = await todoAccess.getTodo(userId, todoId)

  if (!validTodo) {
    throw new Error('404')
  }

  const uploadUrl = attachmentUtils.getUploadUrl(todoId)
  await todoAccess.updateAttachment(userId, todoId)
  return uploadUrl
}
