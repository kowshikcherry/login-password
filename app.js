const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const isValid = require('date-fns/isValid')
const toDate = require('date-fns/toDate')

//const result = addDays(new Date(2021, 0, 11), 10)

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//authanthikatikon

const checkRequestsQueries = async (request, response, next) => {
  const {search_q, category, priority, status, date} = request.query
  const {todoId} = request.params
  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryIsInArray = categoryArray.includes(category)
    if (categoryIsInArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const priorityIsInArray = priorityArray.includes(priority)
    if (priorityIsInArray === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInArray = statusArray.includes(status)
    if (statusIsInArray === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date)

      const formatedDate = format(new Date(date), 'yyyy-MM-dd')
      //console.log(formatedDate, 'f')
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${
            myDate.getMonth() + 1
          }-${myDate.getDate()}`,
        ),
      )
      //console.log(result, 'r')
      //console.log(new Date(), 'new')

      const isValidDate = await isValid(result)
      //console.log(isValidDate, 'V')
      if (isValidDate === true) {
        request.date = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  request.todoId = todoId
  request.search_q = search_q

  next()
}

//get       1
app.get('/todos/', checkRequestsQueries, async (request, response) => {
  const {
    status = '',
    search_q = '',
    priority = '',
    category = '',
  } = request.query
  //console.log(status, search_q, priority, category);
  const getTodosQuery = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate 
        FROM 
            todo
        WHERE 
        todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%' 
        AND status LIKE '%${status}%' AND category LIKE '%${category}%';`

  const todosArray = await db.all(getTodosQuery)
  response.send(todosArray)
})

// get       2

app.get('/todos/:todoId/', checkRequestsQueries, async (request, response) => {
  let {todoId} = request.params
  const getBooksQuery = `
   SELECT
    id,
    todo,
    priority,
    status,
    category,
    due_date AS dueDate
   FROM
    todo
    WHERE id LIKE '%${todoId}%'
   ;`
  const booksArray = await db.get(getBooksQuery)
  response.send(booksArray)
})

// post      4

app.post('/todos/', checkRequestsQueries, async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  const createUserQuery = `
      INSERT INTO 
        todo (id, todo, category, priority, status, due_date) 
      VALUES 
        (
          ${id}, 
          '${todo}',
          '${category}', 
          '${priority}',
          '${status}',
          '${dueDate}'
        )`
  const dbResponse = await db.run(createUserQuery)
  response.send(`Todo Successfully Added`)
})

//put    5

app.put('/todos/:todoId/', checkRequestsQueries, async (request, response) => {
  const {todoId} = request.params
  const bookDetails = request.body
  let {status, priority, todo, category, dueDate} = bookDetails
  if (
    status !== undefined &&
    priority === undefined &&
    todo === undefined &&
    category === undefined &&
    dueDate === undefined
  ) {
    const updateBookQuery = `
    UPDATE
      todo
    SET
      status='${status}'
    WHERE
      id = ${todoId};`
    await db.run(updateBookQuery)
    response.send('Status Updated')
  } else if (
    status === undefined &&
    priority !== undefined &&
    todo === undefined &&
    category === undefined &&
    dueDate === undefined
  ) {
    const updateBookQuery = `
    UPDATE
      todo
    SET
      priority='${priority}'
    WHERE
      id = ${todoId};`
    await db.run(updateBookQuery)
    response.send('Priority Updated')
  } else if (
    status === undefined &&
    priority === undefined &&
    todo !== undefined &&
    category === undefined &&
    dueDate === undefined
  ) {
    const updateBookQuery = `
    UPDATE
      todo
    SET
      todo='${todo}'
    WHERE
      id = ${todoId};`
    await db.run(updateBookQuery)
    response.send('Todo Updated')
  } else if (
    status === undefined &&
    priority === undefined &&
    todo === undefined &&
    category !== undefined &&
    dueDate === undefined
  ) {
    const updateBookQuery = `
    UPDATE
      todo
    SET
      category='${category}'
    WHERE
      id = ${todoId};`
    await db.run(updateBookQuery)
    response.send('Category Updated')
  } else if (
    status === undefined &&
    priority === undefined &&
    todo === undefined &&
    category === undefined &&
    dueDate !== undefined
  ) {
    const updateBookQuery = `
    UPDATE
      todo
    SET
      due_date='${dueDate}'
    WHERE
      id = ${todoId};`
    await db.run(updateBookQuery)
    response.send('Due Date Updated')
  }
})

//delete    6

app.delete(
  '/todos/:todoId/',
  checkRequestsQueries,
  async (request, response) => {
    const {todoId} = request.params
    const deleteBookQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`
    await db.run(deleteBookQuery)
    response.send('Todo Deleted')
  },
)
module.exports = app

/*
//authanthikatikon

const checkRequestsQueries = async (request, response, next) => {
  const {search_q, category, priority, status, date} = request.query
  const {todoId} = request.params
  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryIsInArray = categoryArray.includes(category)
    if (categoryIsInArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const priorityIsInArray = priorityArray.includes(priority)
    if (priorityIsInArray === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInArray = statusArray.includes(status)
    if (statusIsInArray === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date)

      const formatedDate = format(new Date(date), 'yyyy-MM-dd')
      //console.log(formatedDate, 'f')
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${
            myDate.getMonth() + 1
          }-${myDate.getDate()}`,
        ),
      )
      //console.log(result, 'r')
      //console.log(new Date(), 'new')

      const isValidDate = await isValid(result)
      //console.log(isValidDate, 'V')
      if (isValidDate === true) {
        request.date = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  request.todoId = todoId
  request.search_q = search_q

  next()
}

//get       1
app.get('/todos/', checkRequestsQueries, async (request, response) => {
  const {
    status = '',
    search_q = '',
    priority = '',
    category = '',
  } = request.query
  //console.log(status, search_q, priority, category);
  const getTodosQuery = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate 
        FROM 
            todo
        WHERE 
        todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%' 
        AND status LIKE '%${status}%' AND category LIKE '%${category}%';`

  const todosArray = await db.all(getTodosQuery)
  response.send(todosArray)
})

// get       2

app.get('/todos/:todoId/', checkRequestsQueries, async (request, response) => {
  let {todoId} = request.params
  const getBooksQuery = `
   SELECT
    id,
    todo,
    priority,
    status,
    category,
    due_date AS dueDate
   FROM
    todo
    WHERE id LIKE '%${todoId}%'
   ;`
  const booksArray = await db.get(getBooksQuery)
  response.send(booksArray)
})

//get         3

app.get('/agenda/', checkRequestsQueries, async (request, response) => {
  let {date} = request.query
  const getBooksQuery = `
   SELECT
    id,
    todo,
    priority,
    status,
    category,
    due_date AS dueDate
   FROM
    todo
    WHERE due_date = '${date}';`
  const booksArray = await db.all(getBooksQuery)
  response.send(booksArray)
})

// post      4

app.post('/todos/', checkRequestsQueries, async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  const createUserQuery = `
      INSERT INTO 
        todo (id, todo, category, priority, status, due_date) 
      VALUES 
        (
          ${id}, 
          '${todo}',
          '${category}', 
          '${priority}',
          '${status}',
          '${dueDate}'
        )`
  const dbResponse = await db.run(createUserQuery)
  response.send(`Todo Successfully Added`)
})

//put    5

app.put('/todos/:todoId/', checkRequestsQueries, async (request, response) => {
  const {todoId} = request.params
  const bookDetails = request.body
  let {status, priority, todo, category, dueDate} = bookDetails
  if (
    status !== undefined &&
    priority === undefined &&
    todo === undefined &&
    category === undefined &&
    dueDate === undefined
  ) {
    const updateBookQuery = `
    UPDATE
      todo
    SET
      status='${status}'
    WHERE
      id = ${todoId};`
    await db.run(updateBookQuery)
    response.send('Status Updated')
  } else if (
    status === undefined &&
    priority !== undefined &&
    todo === undefined &&
    category === undefined &&
    dueDate === undefined
  ) {
    const updateBookQuery = `
    UPDATE
      todo
    SET
      priority='${priority}'
    WHERE
      id = ${todoId};`
    await db.run(updateBookQuery)
    response.send('Priority Updated')
  } else if (
    status === undefined &&
    priority === undefined &&
    todo !== undefined &&
    category === undefined &&
    dueDate === undefined
  ) {
    const updateBookQuery = `
    UPDATE
      todo
    SET
      todo='${todo}'
    WHERE
      id = ${todoId};`
    await db.run(updateBookQuery)
    response.send('Todo Updated')
  } else if (
    status === undefined &&
    priority === undefined &&
    todo === undefined &&
    category !== undefined &&
    dueDate === undefined
  ) {
    const updateBookQuery = `
    UPDATE
      todo
    SET
      category='${category}'
    WHERE
      id = ${todoId};`
    await db.run(updateBookQuery)
    response.send('Category Updated')
  } else if (
    status === undefined &&
    priority === undefined &&
    todo === undefined &&
    category === undefined &&
    dueDate !== undefined
  ) {
    const updateBookQuery = `
    UPDATE
      todo
    SET
      due_date='${dueDate}'
    WHERE
      id = ${todoId};`
    await db.run(updateBookQuery)
    response.send('Due Date Updated')
  }
})

//delete    6

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteBookQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`
  await db.run(deleteBookQuery)
  response.send('Todo Deleted')
})
module.exports = app
*/
