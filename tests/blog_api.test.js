const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')

beforeEach(async () => {
    await Blog.deleteMany({})

    const blogObjects = helper.initialBlogs
        .map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
})

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

test('unique identifier is named id and not _id', async () => {
    const response = await api.get('/api/blogs')

    const contents = response.body.map(r => r.id)

    expect(contents).toBeDefined()
})

test('a valid blog can be added', async () => {
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

test('if blog is added without likes, default to 0 likes', async () => {
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

test('blog without title and url is not added', async () => {
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

afterAll(() => {
    mongoose.connection.close()
})