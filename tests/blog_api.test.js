const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')

beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
})

describe('when there are already some blogs saved', () => {
    test('blogs are returned as json', async () => {
        await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })

    test('all blogs are returned', async () => {
        const response = await api.get('/api/blogs')

        expect(response.body).toHaveLength(helper.initialBlogs.length)
    })

    test('a specific blog is within the returned blogs', async () => {
        const response = await api.get('/api/blogs')

        const contents = response.body.map(r => r.title)

        expect(contents).toContainEqual(
            'Go To Statement Considered Harmful'
        )
    })

    test('unique identifier is named id and blog_id', async () => {
        const response = await api.get('/api/blogs')

        const contents = response.body.map(r => r.id)

        expect(contents).toBeDefined()
    })
})

describe('adding a new blog', () => {
    test('succeeds when a valid blog can be added', async () => {
        const newBlog = {
            title: 'New blog has been added',
            author: 'Joker',
            url: 'http://www.test.com',
            likes: 5
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const response = await api.get('/api/blogs')

        const contents = response.body.map(r => r.title)

        expect(response.body).toHaveLength(helper.initialBlogs.length + 1)
        expect(contents).toContainEqual(
            'New blog has been added'
        )
    })

    test('default to 0 likes if blog is added without likes value', async () => {
        const newBlog = {
            title: 'New blog with missing likes value',
            author: 'Joker',
            url: 'http://www.test.com'
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const response = await api.get('/api/blogs')

        const newAddition = response.body.find(r => r.title === 'New blog with missing likes value')

        expect(response.body).toHaveLength(helper.initialBlogs.length + 1)
        expect(newAddition.likes).toBe(0)
    })

    test('blog without title and url is not added - 400 error', async () => {
        const newBlog = {
            author: 'Joker',
            likes: 17
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(400)

        const response = await api.get('/api/blogs')

        expect(response.body).toHaveLength(helper.initialBlogs.length)
    })
})

describe('deletion of a blog', () => {
    test('succeeds with code 204 if id is valid', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toHaveLength(
            helper.initialBlogs.length - 1
        )

        const contents = blogsAtEnd.map(r => r.title)

        expect(contents).not.toContain(blogToDelete.title)
    })

})

describe('viewing a specific blog', () => {
    test('succeeds with a valid id', async () => {
        const blogsAtStart = await helper.blogsInDb()

        const blogToView = blogsAtStart[0]

        const resultBlog = await api
            .get(`/api/blogs/${blogToView.id}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const processedBlogToView = JSON.parse(JSON.stringify(blogToView))

        expect(resultBlog.body).toEqual(processedBlogToView)
    })

    test('fails with status code 404 if blog does not exist', async () => {
        const validNonexistingId = await helper.nonExistingId()

        console.log(validNonexistingId)

        await api
            .get(`/api/blogs/${validNonexistingId}`)
            .expect(404)
    })

    test('fails with status code 400 if id is invalid', async () => {
        const invalidId = '5a3d5da59070081a82a3445'

        await api
            .get(`/api/blogs/${invalidId}`)
            .expect(400)
    })
})


describe('updating a specific blog', () => {
    test('succeeds with a 200 status when number of likes has been updated for a specific blog', async () => {
        const blogsAtStart = await helper.blogsInDb()

        const blogToUpdate = {
            title: blogsAtStart[0].title,
            author: blogsAtStart[0].author,
            url: blogsAtStart[0].url,
            likes: blogsAtStart[0].likes + 1
        }

        await api
            .put(`/api/blogs/${blogsAtStart[0].id}`)
            .send(blogToUpdate)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const response = await api.get('/api/blogs')

        const updatedBlog = response.body.find(r => r.id === blogsAtStart[0].id)

        expect(response.body).toHaveLength(helper.initialBlogs.length)
        expect(updatedBlog.likes).toBe(blogToUpdate.likes)
    })
})

afterAll(() => {
    mongoose.connection.close()
})