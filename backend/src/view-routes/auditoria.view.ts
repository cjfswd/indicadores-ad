import { Router } from 'express'
import { getKysely } from '../config/database.js'

export const auditoriaViewRouter = Router()

const PAGE_SIZE = 20

// GET /auditoria — full page
auditoriaViewRouter.get('/', async (req, res) => {
  const db = getKysely()
  const page = Math.max(1, Number(req.query.page) || 1)
  const busca = (req.query.busca as string) || ''

  let query = db.selectFrom('audit_log').selectAll().orderBy('timestamp', 'desc')
  let countQuery = db.selectFrom('audit_log').select(({ fn }) => fn.countAll<number>().as('total'))

  if (busca) {
    query = query.where('entidade', 'like', `%${busca}%`)
    countQuery = countQuery.where('entidade', 'like', `%${busca}%`)
  }

  const { total } = await countQuery.executeTakeFirstOrThrow()
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const logs = await query
    .offset((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .execute()

  res.render('auditoria', { title: 'Auditoria', currentPath: '/auditoria', logs, page, totalPages })
})

// GET /auditoria/table — partial (HTMX)
auditoriaViewRouter.get('/table', async (req, res) => {
  const db = getKysely()
  const page = Math.max(1, Number(req.query.page) || 1)
  const busca = (req.query.busca as string) || ''

  let query = db.selectFrom('audit_log').selectAll().orderBy('timestamp', 'desc')
  let countQuery = db.selectFrom('audit_log').select(({ fn }) => fn.countAll<number>().as('total'))

  if (busca) {
    query = query.where('entidade', 'like', `%${busca}%`)
    countQuery = countQuery.where('entidade', 'like', `%${busca}%`)
  }

  const { total } = await countQuery.executeTakeFirstOrThrow()
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const logs = await query
    .offset((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .execute()

  res.render('components/auditoria-table', { layout: false, logs, page, totalPages })
})
