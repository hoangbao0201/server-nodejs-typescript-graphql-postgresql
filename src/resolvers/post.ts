import { PostMutationResponse } from "../types/PostMutationResponse";
import { Arg, Ctx, ID, Mutation, Query, Resolver } from "type-graphql";
import { CreatePostInput } from "../types/CreatePostInput";
import { Post } from "../entities/Post";
import { UpdatePostInput } from "../types/UpdatePostInput";
import { Context } from "../types/Context";

@Resolver()
export class PostResolver {
    @Mutation((_return) => PostMutationResponse)
    async createPost(
        @Arg("createPostInput") { title, text }: CreatePostInput
    ): Promise<PostMutationResponse> {
        try {
            const newPost = Post.create({
                title,
                text,
            });
            await newPost.save();

            return {
                code: 200,
                success: true,
                message: "Post created successfully",
                post: newPost,
            };
        } catch (error) {
            return {
                code: 500,
                success: false,
                message: `Internal server error ${error.message}`,
            };
        }
    }

    @Query((_return) => [Post], { nullable: true })
    async posts(): Promise<Post[] | null> {
        return await Post.find({});
    }

    @Query((_return) => Post, { nullable: true })
    async post(
        @Arg("id", (_type) => ID) id: number
    ): Promise<Post | null> {
        const post = await Post.findOne({ where: { id: id } });
        return post;
    }

    @Mutation(_return => PostMutationResponse, { nullable: true })
    async updatePost(
        @Arg('updatePostInput') { id, title, text } : UpdatePostInput
    ): Promise<PostMutationResponse> {
        try {
            const existingPost = await Post.findOne({ where: { id: id } })
            if(!existingPost) {
                return {
                    code: 400,
                    success: false,
                    message: 'Post not found'
                }
            }

            existingPost.title = title;
            existingPost.text = text;

            await existingPost.save();

            return {
                code: 200,
                success: true,
                message: 'Post updated successfully',
                post: existingPost
            }

        } catch (error) {
            return {
                code: 500,
                success: false,
                message: `Internal server error ${error}`
            }
        }
    }

    @Mutation(_return => PostMutationResponse)
    async deletePost(
        @Arg('id', _type => ID) id : number,
        @Ctx() { req } : Context
    ): Promise<PostMutationResponse> {
        try {

            console.log("REQUEST.SESSION: ", req.session)

            const existingPost = await Post.findOne({ where: { id: id } });
            if(!existingPost) {
                return {
                    code: 400,
                    success: false,
                    message: 'Post not found'
                }
            }

            await Post.delete(id);

            return {
                code: 200,
                success: true,
                message: 'Post deleted successfully',
            }

        } catch (error) {
            return {
                code: 500,
                success: false,
                message: `Internal server error ${error}`
            }
        }
    }
}
