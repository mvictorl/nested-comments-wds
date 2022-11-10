import fastify from 'fastify'
import sensible from '@fastify/sensible'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config()

const app = fastify()
const prisma = new PrismaClient()

const COMMENT_SELECT_FIELDS = {
	id: true,
	message: true,
	parentId: true,
	createdAt: true,
	user: {
		select: {
			id: true,
			name: true,
		},
	},
}

app.register(sensible)
app.register(cookie, { secret: process.env.COOKIE_SECRET })
app.register(cors, {
	origin: process.env.CLIENT_URL,
	credentials: true,
})

// Middleware for make a fake "userId" cookies
const CURRENT_USER_ID = (
	await prisma.user.findFirst({ where: { name: 'Kyle' } })
).id

app.addHook('onRequest', (req, res, done) => {
	if (req.cookies.userId !== CURRENT_USER_ID) {
		req.cookies.userId = CURRENT_USER_ID
		res.clearCookie('userId')
		res.setCookie('userId', CURRENT_USER_ID)
	}
	done()
})

app.get('/posts', async (req, res) => {
	return await databaseRequest(
		prisma.post.findMany({
			select: {
				id: true,
				title: true,
			},
		})
	)
})

app.get('/posts/:id', async (req, res) => {
	return await databaseRequest(
		prisma.post
			.findUnique({
				where: { id: req.params.id },
				select: {
					title: true,
					body: true,
					comments: {
						orderBy: {
							createdAt: 'desc',
						},
						select: {
							...COMMENT_SELECT_FIELDS,
							_count: { select: { likes: true } },
						},
					},
				},
			})
			.then(async post => {
				const likes = await prisma.like.findMany({
					where: {
						userId: req.cookies.userId,
						commentId: { in: post.comments.map(comment => comment.id) },
					},
				})

				return {
					...post,
					comments: post.comments.map(comment => {
						const { _count, ...commentFields } = comment

						return {
							...commentFields,
							likedByMe: likes.find(like => like.commentId === comment.id),
							likeCount: _count.likes,
						}
					}),
				}
			})
	)
})

app.post('/posts/:id/comments', async (req, res) => {
	if (req.body.message === '' || req.body.message == null) {
		return res.send(app.httpErrors.badRequest('Message is required'))
	}

	return await databaseRequest(
		prisma.comment
			.create({
				data: {
					message: req.body.message,
					userId: req.cookies.userId,
					parentId: req.body.parentId,
					postId: req.params.id,
				},
				select: COMMENT_SELECT_FIELDS,
			})
			.then(comment => {
				return {
					...comment,
					likeCount: 0,
					likedByMe: false,
				}
			})
	)
})

app.put('/posts/:pid/comments/:cid', async (req, res) => {
	if (req.body.message === '' || req.body.message == null) {
		return res.send(app.httpErrors.badRequest('Message is required'))
	}

	const { userId } = await prisma.comment.findUnique({
		where: { id: req.params.cid },
		select: { userId: true },
	})

	if (userId !== req.cookies.userId) {
		return res.send(
			app.httpErrors.unauthorized(
				"You don't have permission to edit this message"
			)
		)
	}

	return await databaseRequest(
		prisma.comment.update({
			where: { id: req.params.cid },
			data: { message: req.body.message },
			select: { message: true },
		})
	)
})

app.delete('/posts/:pid/comments/:cid', async (req, res) => {
	const { userId } = await prisma.comment.findUnique({
		where: { id: req.params.cid },
		select: { userId: true },
	})

	if (userId !== req.cookies.userId) {
		return res.send(
			app.httpErrors.unauthorized(
				"You don't have permission to delete this message"
			)
		)
	}

	return await databaseRequest(
		prisma.comment.delete({
			where: { id: req.params.cid },
			select: { id: true },
		})
	)
})

app.post('/posts/:pid/comments/:cid/toggleLike', async (req, res) => {
	const data = {
		commentId: req.params.cid,
		userId: req.cookies.userId,
	}

	const like = await prisma.like.findUnique({
		where: { userId_commentId: data },
	})

	if (like == null) {
		return await databaseRequest(prisma.like.create({ data })).then(() => {
			return { addLike: true }
		})
	} else {
		return await databaseRequest(
			prisma.like.delete({ where: { userId_commentId: data } })
		).then(() => {
			return { addLike: false }
		})
	}
})

async function databaseRequest(promise) {
	const [error, data] = await app.to(promise)

	if (error) return app.httpErrors.internalServerError(error.message)

	return data
}

app.listen({ port: process.env.PORT })
