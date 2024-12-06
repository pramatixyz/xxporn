import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const endpoint = process.env.GRAPHQL_ENDPOINT;
    if (!endpoint) {
        throw new Error("GRAPHQL_ENDPOINT environment variable is not set");
    }

    const graphQLClient = new GraphQLClient(endpoint);
    const referringURL = ctx.req.headers?.referer ?? null;
    const pathArr = ctx.query.postpath as Array<string>;

    if (!Array.isArray(pathArr)) {
        return {
            notFound: true,
        };
    }

    const path = pathArr.join('/');
    const fbclid = ctx.query.fbclid;

    if (referringURL?.includes('facebook.com') || fbclid) {
        return {
            redirect: {
                permanent: false,
                destination: `https://saveourstateok.org/${encodeURIComponent(path)}`,
            },
        };
    }

    const query = gql`
        {
            post(id: "/${path}/", idType: URI) {
                id
                excerpt
                title
                link
                dateGmt
                modifiedGmt
                content
                author {
                    node {
                        name
                    }
                }
                featuredImage {
                    node {
                        sourceUrl
                        altText
                    }
                }
            }
        }
    `;

    const data = await graphQLClient.request(query);

    if (!data?.post) {
        return {
            notFound: true,
        };
    }

    return {
        props: {
            path,
            post: data.post,
            host: ctx.req.headers.host,
        },
    };
};

interface PostProps {
    post: any;
    host: string;
    path: string;
}

const Post: React.FC<PostProps> = ({ post, host }) => {
    const removeTags = (str: string | null): string => {
        if (!str) return '';
        return str.replace(/(<([^>]+)>)/gi, '').replace(/\[[^\]]*\]/g, '');
    };

    return (
        <>
            <Head>
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={removeTags(post.excerpt)} />
                <meta property="og:type" content="article" />
                <meta property="og:locale" content="en_US" />
                <meta property="og:site_name" content={host.split('.')[0]} />
                <meta property="article:published_time" content={post.dateGmt} />
                <meta property="article:modified_time" content={post.modifiedGmt} />
                <meta
                    property="og:image"
                    content={post.featuredImage?.node?.sourceUrl || '/default-image.jpg'}
                />
                <meta
                    property="og:image:alt"
                    content={post.featuredImage?.node?.altText || post.title}
                />
                <title>{post.title}</title>
            </Head>
            <div className="post-container">
                <h1>{post.title}</h1>
                {post.featuredImage?.node && (
                    <img
                        src={post.featuredImage.node.sourceUrl}
                        alt={post.featuredImage.node.altText || post.title}
                    />
                )}
                <article dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
        </>
    );
};

export default Post;
