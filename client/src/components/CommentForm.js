import { useState } from 'react'

export function CommentForm({
	loading,
	error,
	onSubmit,
	autoFocus = false,
	initValue = '',
}) {
	const [message, setMessage] = useState(initValue)

	function handleSubmit(e) {
		e.preventDefault()
		onSubmit(message).then(() => setMessage(''))
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="comment-form-row">
				<textarea
					autoFocus={autoFocus}
					className="message-input"
					value={message}
					onChange={e => setMessage(e.target.value)}
				/>
				<button className="btn" type="submit" disabled={loading}>
					{loading ? 'Loading...' : 'Post'}
				</button>
			</div>
			<div className="error-msg">{error}</div>
		</form>
	)
}
