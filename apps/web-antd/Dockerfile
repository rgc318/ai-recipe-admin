# ./apps/web-antd/Dockerfile

# --- 阶段一：构建环境 (Builder) ---
FROM node:20-alpine AS builder

# 安装 git（如果某些依赖或脚本需要）
RUN apk add --no-cache git

WORKDIR /app

# 复制其余源代码
COPY . .

# 启用 corepack，以支持 pnpm
RUN npm i -g corepack
RUN pnpm install




# 设置构建时环境变量（根据需要），例如 VITE_BASE、环境生产模式等
ARG VITE_BASE=/
ENV VITE_BASE=${VITE_BASE}
ENV NODE_ENV=production

# 构建 web-antd 应用
# 前提是 web-antd 的 package.json 的 name 是 web-antd 或者类似名字
RUN pnpm build


# 或者，如果你确定子项目有独立 build 脚本，也可以：
# RUN pnpm --filter web-antd build

# --- 阶段二：生产环境 (Production) ---
FROM nginx:alpine AS production

# 如果你想使用 gzip / brotli 压缩，需要 nginx image support 或者自己编译 nginx + 模块
# 可视情况启用

# 删除默认的 nginx 静态设置（可选）
# RUN rm /etc/nginx/conf.d/default.conf

# 复制 web-antd 的构建产物
COPY --from=builder /app/apps/web-antd/dist /usr/share/nginx/html

# 复制 nginx 配置文件
COPY apps/web-antd/nginx.conf /etc/nginx/conf.d/default.conf

# 设置静态资源基础路径（如果非根路径部署，需要在 nginx.conf 或 VITE_BASE 配置）
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
