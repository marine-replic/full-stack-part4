const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    const reducer = (sum, item) => {
        return sum + item
    }
    const likes = blogs.map(blog => blog.likes)

    return likes.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {

    const mostLikes = Math.max.apply(Math, blogs.map(blog => blog.likes))

    const mostLikedBlog = blogs.find((blog) => blog.likes === mostLikes)

    return blogs.length === 0
        ? {}
        : mostLikedBlog
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog
}