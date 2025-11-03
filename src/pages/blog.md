---
title: "Blog - AI Research & Machine Learning Insights | Preslav Aleksandrov"
navTitle: "Blog"
description: "Blog by Preslav Aleksandrov, PhD Computer Science student at Cambridge. Read insights on AI research, machine learning, transformer architectures, and academic life."
keywords: "AI Research Blog, Machine Learning Blog, PhD Student Blog, Computer Science Research, Cambridge AI Blog, Deep Learning Insights, Academic Blog"
layout: page.njk
eleventyNavigation:
  order: 1
---

<div class="blog-index">
  {% if collections.posts.length > 0 %}
    <div class="post-list">
    {% for post in collections.posts | reverse %}
      <a href="{{ post.url }}" class="post-card">
        <div class="post-meta">
          {% if post.data.date %}
            <time>{{ post.data.date | date: "%b %d, %Y" }}</time>
          {% endif %}
        </div>
        <h2 class="post-title">{{ post.data.title }}</h2>
        {% if post.data.description %}
          <p class="post-description">{{ post.data.description }}</p>
        {% endif %}
      </a>
    {% endfor %}
    </div>
  {% else %}
    <div class="empty-state">
      <p>No posts yet. Check back soon!</p>
    </div>
  {% endif %}
</div>
