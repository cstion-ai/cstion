# WeChat module

## Status

Not implemented. The shared [`ChannelSchema`](../src/shared/schemas.ts) accepts
`"wechat"`, but the repository has no WeChat adapter, webhook route,
configuration, or tests. The executable channel pipeline is
[Kakao-specific](../src/pipelines/kakao-to-crm.ts).

## Planned scope

The [architecture](../docs/architecture.md) and
[data-flow document](../docs/data-flow.md) list WeChat support only as future
work. They do not specify an adapter design or describe a working WeChat path.

WeChat-specific authentication, request limits, payload validation, and test
fixtures remain design and implementation work.
