import Executor from '@hydre/graphql-batch-executor'
import object_buffer from './object_buffer.js'

export default graphql_options => ({
  socket,
  request,
  context,
}) => {
  const {
    context: per_op_context,
    ...options
  } = graphql_options
  const executor = new Executor({
    ...options,
    context: () =>
      per_op_context({
        socket,
        request,
        context,
      }),
  })

  socket.on('channel', async channel => {
    const { value } = await channel.read[
        Symbol.asyncIterator
    ]().next()
    const operation = object_buffer.rtl(value.buffer)
    const stream = await executor.execute(operation)

    channel.on_close(() => {
      stream.end()
    })

    for await (const chunk of stream)
      await channel.write(new Uint8Array(object_buffer.ltr(chunk)))


    channel.close()
  })
}
