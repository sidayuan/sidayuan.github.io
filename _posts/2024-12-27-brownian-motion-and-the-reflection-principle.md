---
layout: post
title: "Brownian motion and the reflection principle"
author: Sida Yuan
description:
date: 2024-12-27
categories:
  - Technical
tags:
  - Mathematics
published: true
---

## The tl;dr

- In this post, I talk about a turning point in my life when I went from being a maths student to a researcher.
- It involves proving an existing theorem about Brownian bridges with a more accessible and elegant approach than what's usually in the literature.
- I introduce the necessary maths to understand this result in an accessible way to non-experts.  

<br>

<b>Table of contents</b>
* Table of contents
{:toc}

<br>

## Maths as a formative life experience

An alternative--or perhaps even a more appropriate--title would be something like:
> That one time I filled a hole in my lecturer's course notes

Because really, when I think about Brownian bridges and the reflection principle, I don't think of maths. Instead, I think of a period in my life at the university when I was transitioning from a student to a <i>researcher</i>. And it was Brownian bridges that made me realise that mathematics research wasn't another abstract thing to me like building a spaceship or doing brain surgery. That--unlike those things--I really <i>could</i> be a mathematics researcher.

To set the scene, in my third year at the University of Sydney, I took my first course in stochastic processes. If you don't know what that is, first of all: don't fret. <b>My goal here is to write about maths in an educational way that hopefully non-experts can understand, at least at a high level.</b> And secondly, stochastic processes is a subfield within probability theory. Probability theory is the study of random variables, which are objects that behave randomly (like the outcome of flipping a coin). A stochastic process is, as the lecturer (and my ultimately my research supervisor) put it, "randomness indexed by time", which just means a sequence of random variables across time, e.g. $\\{X_t : t=0,1,\dots, T\\} = \\{X_0, X_1, X_2, \dots, X_T\\}$. So my lecturer was being quite literal (as all mathematicians tend to be, now that I think about it); a stochastic process is just random variables indexed by time.

When I took this third year introductory course to stochastic processes, I was still most definitely a maths <i>student</i>. It was the lecturer who offered to take me under his wing and give me an opportunity to do real mathematics research. Over the summer, my mentor had me read up on some of his papers. Any mathematician knows when you first try to sink your teeth into a new research area, you'll need to at least spend months building up foundational theory in that domain. As such, I ended up spending a considerable amount of time going through my mentor's full set of lecture notes, of which the stochastic processes course covered maybe around 40%. This meant I could do two things for my mentor's lecture notes. Firstly, I could identify typos and errors. But secondly, and more importantly...

In my mentor's lecture notes, he wanted to include a key theorem about a class of stochastic processes called Brownian bridges. However, the only way to prove that theorem that he was aware of was by invoking an advanced theorem that was definitely outside the scope of undergraduate mathematics. Therein lies the tension:
- Mathematics is all about proofs.
- Undergraduate lecture notes for maths should represent a <i>progressive</i> journey, where results are proven in ways accessible by undergraduates, and those results are then used to prove other important results.
- This particular theorem that the lecturer wanted to keep was elegant and important to the study of Brownian motion.
- There was seemingly no way to prove this theorem using undergraduate tools...
... or was there?

My mentor left in a proof of the theorem in his lecture notes, but highlighted the step where he invokes more advanced results in red. I think he had a feeling that it could be done, but left the investigation in his backlog. And thus, when I was making my way through his lecture notes, he directed me to focus on this particular problem.

And after a couple of days, I managed to produce a proof of the theorem using only knowledge built up to that point in his lecture notes. I'd go even further and say that the proof was elegant, and used the very essence of what made a Brownian bridge a Brownian bridge. This was the first time I had accomplished a genuine sense of mathematical discovery outside of the didactic environment of course work. And it was the experience that taught me I really could do research.

And thus, as my mentor added my proof into his lecture notes, they were finally complete. He had rather humorously said that if he were to actually give a course that included Brownian bridges, he would invite me as a guest lecturer. While I'm glad that this was never actualised, I decided to write this post on it instead.

<br>

## The mission

An alternative title for this post that would be more appealing to goal-oriented mathematicians would be:
> Deriving the distribution of the first hitting time of Brownian bridge with drift without using Girsanov's theorem

### Accessibility to non-experts

Immediately, there is a lot to unpack here. What is a "first hitting time"? A "Brownian bridge"? A "drift"? A "Girsanov's theorem"?

If you're a non-mathematician, this is probably already enough jargon to discourage you from continuing. But actually, you are the core audience for this post (and likely any of my future writings on maths). I strongly believe in the idea that maths can have wide appeal, and the only reason why it doesn't is because currently it tends to cater to a very small and esoteric audience who have seemingly given up on this idea. It's strange to me that a lot of people are able to enjoy and appreciate literature, but not maths, despite them both being context-heavy and requiring a lot of prerequisite knowledge to fully understand. I think the terrible way in which maths is taught in high school education has a lot to do with it, but alas that's a discussion for another day.

And so the primary mission here is to talk about these maths ideas and topics that are typically only encountered in postgraduate studies, in a way that's digestible for someone who might have only studied maths at the high school level. Of course, it'll be a challenge, and the only way we can meet it is by talking about foundational concepts at a high-level when necessary. And maybe at times such a reader may not fully understand how the proof might work, but even a high-level understanding would be enough for appreciating how maths is "conducted" at an advanced level.

### The actual maths problem at hand

With that out of the way, what is the exact problem that we're trying to solve?

We'll delve more into the details of what each of the terms mean later, but essentially a "Brownian bridge with drift" is a specific kind of a stochastic process. One thing that's commonly investigated about any stochastic process is how long it'll take before it reach some region in the space that it's randomly walking in. If you think of the movement of an ant as being a stochastic process, then "how long will it take for the ant to find the exit to the room" would be such a question. we call such questions "first hitting times". A first hitting time is a random object ("random variable") in itself, as its dependency on the randomness of the stochastic process means that the first hitting time can potentially happen at any point in time. Since a first hitting time is a random variable, it must have a probability distribution. Distributions are helpful in helping us understand the randomness of the object, for example its expectation and variable are often directly calculated through its distribution.

And so at a high-level, the maths problem at hand is: what's the probability distribution of the first hitting time of a Brownian bridge with drift?

A "theorem" is a significant mathematical result, and there's the theorem for this distribution already exists. However, its proof typically invokes a much more advanced result called Girsanov's theorem. And while Girsanov's theorem can certainly get us this distribution, we would then be troubled by the question of "but how do we prove Girsanov's theorem?" That this question requires a much more advanced field called stochastic analysis to answer.

All of that is to say, for course on stochastic processes before stochastic analysis, we want to determine the distribution of the first hitting time <i>without</i> Girsanov's theorem.


<br>

## Building up the understanding

Like the Lord of the Rings movies, you can't understand the third movie if you don't know what happens in the first two.

If you're already well-versed with all of the concepts discussed, you can probably already skip to the proof section at the end of this post. But once again, the audience I want to cater to are non-mathematicians, so in this section we'll build up the necessary knowledge to mathematically understand the theorem and its proof. To such a reader, this section will likely be the most valuable.

### Random variables

A <i>random variable</i> is simply any object such that its realised value isn't deterministic, that is, it's a variable that's random. (See, I told you mathematicians tend to be very literal.) Coin flips, dice rolls, stock prices, the position of a drop of dye in a beaker, are all examples of RVs. But how do we actually mathematically formulate a random variable?

Let $(\Omega, \mathcal F,\mathbb P)$ be a probability space, where:
- $\Omega$ is the set of possible outcomes. I like to think of this is a set of <b>parallel universes</b>, where if theoretically you know what universe you're in, then theoretically you can determine the outcome of every random variable.
- $\mathcal F$ is a sigma-algebra. This is the set of all possible "events" that we can calculate probabilities for. For example, "getting heads on the first flip and tails on the second and third flips" is an event.
- $\mathbb P$ is a probability measure. This is a function that assigns probabilities to each event in $\mathcal F$. In the parallel universe interpretation of $\Omega$, given an event, the measure $\mathbb P$ tells the portion of parallel universes for which that event occurs.

This is the formulation of probability using measure theory, which is a branch of maths that studies measures (e.g. areas, volumes, probabilities). Why measure theory? Two reasons. Firstly, probabilities are just measures. Secondly, due to very complicated reasons about maths itself, the popular [mainstream formulation](https://en.wikipedia.org/wiki/Zermelo%E2%80%93Fraenkel_set_theory#Axiom_of_well-ordering_(choice)) of maths allows for the existence of [non-measurable sets](https://en.wikipedia.org/wiki/Non-measurable_set), which are things that you can't measure because attempting to measure them breaks the [definiton](https://en.wikipedia.org/wiki/Measure_(mathematics)#Definition) of what a measure is.

A random variable $X(\omega)$ is a function that takes an outcome $\omega\in\Omega$ as input and outputs some value (1 to 6 forf a dice roll, heads or tails for a coin flip, a positive real number for a stock price). This is where the parallel universes interpretation of $\Omega$ comes handy: where $\omega\in\Omega$ is a single parallel universe, $X(\omega)$ has a single deterministic value--it's no longer random! But if we don't know which parallel universe we're in, then $X$ might be any value--it's random.

<span style="color:lightgrey">There are also another condition required for $X$ to be a random variable: it needs to be measurable, but we can safely skip this as the nuances of measure theory aren't required for our discussion.</span>

If we don't know which parallel universe we're in, then how do we gain information about the value of the random variable $X$?

That's where its probability distribution comes in. In this post, we're going to focus on continuous-valued random variables only. That is, where $X(\omega)\in \mathbb R$ (where $\mathbb R$ is the set of all real values, e.g. 0, -1, 0.12, $\pi$). For example, the stock price at a future point in time can be modelled as a continuous-valued random variable that takes positive real values only.

The probability distribution of a continuous random variable $X$ is given by its <i>probability density</i> function, which can be written as $f_X(x)$ or $\mathbb P(X \in dx)$. For a probability density to be valid, the random variable must "take a real value with certainty", that is, it must be true that

$$\mathbb P(X\text{ takes a real value}) = \mathbb P(-\infty < X < +\infty) = \int_{-\infty}^{+\infty} f_X(x)\, dx = \int_{-\infty}^{+\infty} \mathbb P(X \in dx) = 1.$$

I want to highlight that $\mathbb P(X \in dx)$ is a particularly useful way of representing a density. Think of $dx$ as "an infinitesimally small region around $x$", or "the interval $(x-\varepsilon, x+\varepsilon)$ as $\varepsilon$ shrinks to zero" (remember high school calculus?). That way, we can make sense of a probability density as a probability of an (really specific) event that we can play around with when it's convenient (and we <i>will</i> do so later). Something else that's worth mentioning here is that the above equation highlights a crucial aspect of continuous random variables; that calculating probabilities, or statistical quantities that involve probabilities (e.g. mean and variance), is just a matter of integration. For better or for [worse](https://en.wikipedia.org/wiki/Nonelementary_integral).

Note that to describe the distribution of a random variable, it's simply enough to give its <i>cumulative distribution function</i> $F(x) = \mathbb P(X \le x)$ or its density, as differentiating the former gives you the latter while integrating the latter gives you the former. So when we talk about the "distribution" of a random variable, you can think of either way of representing it.

We don't need to go much further into the theory of random variables for the objectives of this post, but I'll mention two key quantities, the mean and the variance of a random variable:

$$\begin{align}
  \mathbb E[X] &= \int_{-\infty}^{+\infty} x f_X(x)\, dx\\
  \text{Var}(X) &= \int_{-\infty}^{+\infty} \left(x - \mathbb E[X]\right)^2 f_X(x)\, dx
\end{align}$$

The most commonly used continuous random variable is one that you're probably familiar with yourself: a normally distributed random variable, for which it has the density $f_X(x) = \frac{1}{\sqrt{2\pi\sigma^2}} e ^ {-(x - \mu)^2 / 2\sigma^2}$, where $\mu$ and $\sigma^2$ are its mean and variance respectively. We write "$X \sim N(\mu, \sigma^2)$" to mean that the random variable $X$ is of this normal distribution.

<span style="color:red">Insert random normal generator here</span>


<details>
<summary>Example: uniform distribution</summary>

Let $U$ be a uniformly distributed random variable over $[a, b]$. This means it has a probability density given by $f_U(x) = 1/(b - a)$ when $x\in[a,b]$ and zero everywhere else. Then, it's mean and variance are given by

$$\begin{align}
  \mathbb E[X] &= \int_{a}^{b} \frac{x}{b - a}\, dx = \frac12\frac{b^2 - a^2}{b - a} = \frac12\frac{(b-a)(b+a))}{b - a} = \frac{a + b}{2},\\
  \text{Var}(X) &= \int_{a}^{b} \left(x - \mathbb E[X]\right)^2 \frac{1}{b - a}\, dx \\
  &= \int_{a}^{b} \frac{x^2}{b - a}\, dx - \mathbb E[X]^2 \\
  &= \frac{b^3 - a^3}{3(b-a)} - \left(\frac{a + b}{2}\right)^2 \\
  &= \frac{a^2 + ab + b^2}{3} - \frac{a^2 + 2ab - b^2}{4} \\
  &= \frac{(b-a)^2}{12},
\end{align}$$

where we applied the <a href="https://en.wikipedia.org/wiki/Difference_of_two_squares">difference of two squares</a> in the calculation of the expectation, and in the calculation of the variance, we applied the formula that $\text{Var}(X) = \mathbb E[X^2] - \mathbb E[X]^2$ (easy to verify yourself) and the <a href="https://study.com/learn/lesson/difference-cubes-formula-problems.html">difference of two cubes</a>.

</details>

<br>

I want to highlight a useful property on how normally distributed random variables scale. Let $N\sim N(0,1)$ and $X = \sigma N$. Then, $X \sim N(0,\sigma^2)$. That is, every normally distributed random variable can be expressed as transformation of a simpler normally distributed random variable.

<details>
<summary>Proof</summary>
The probability of $X$ taking values below $a$ is given by

$$\mathbb P(X < a) = \mathbb P(\sigma N < a) = \mathbb P(N < a/\sigma) = \int_{-\infty}^{a/\sigma} f_N(y)\,dy = \int_{-\infty}^{a/\sigma} \frac{1}{\sqrt{2\pi}}e^{-\frac{y^2}{2}}\,dy.$$

Let's do the change of variables $y = x/\sigma$, so $dy = (1/\sigma)dx$ and hence

$$\mathbb P(X < b) = \int_{-\infty}^{a} \frac{1}{\sqrt{2\pi\sigma^2}}e^{-\frac{x^2}{2\sigma^2}}\,dx,$$

therefore we see that the density of $X$ is the same as that for $N(0,\sigma^2)$, so $X\sim N(0,\sigma^2)$.

</details>

<br>

Finally, I want to quickly mention independence. Two random variables $X$ and $Y$ are independent if knowing the value of one random variable doesn't give me any information about the other. For example, flipping a coin multiple times is independent, as knowing how one toss landed doesn't give me any information about the next toss. However, whether it's currently raining and whether the sky is cloudy are dependent random variables; if I know the former is true then the latter is probably also true.

And with that, we're now ready to talk about stochastic processes.


### Stochastic processes

I've mentioned earlier that stochastic processes are "randomness indexed by time". Specifically, they are <i>random variables</i> indexed by time. We're only going to be talking about continuous-time stochastic processes in this post. This is as opposed to discrete-time stochastic processes, such as my money during the course of 100 rounds on a slot machine.

A (continuous-time) stochastic process is given by $\\{X_t : t\in[0,T]\\}$, where $X_t$'s are random variables and $T$ is some end time (possibly infinite).

<span style="color: lightgrey;">Technically stochastic processes are also "adapted to filtrations", but this we don't need to go into that much nuance here.</span>

One question that's asked about stochastic processes is: what are the properties of the first hitting times for that particularly stochastic process? Before I formulate what a first hitting time is, I need to first formulate the concept of a "first".

Let $S = (0,1)$ be a set of real numbers between zero and one, but excluding the end points. That is, 0.5, 0.001 are in $S$, but zero and one are not. What's the minimum element of this set $\min S$? You might be tempted to say zero, but that would be correct because zero isn't in this set! What about 0.001? But that can't be the smallest number in $S$, because 0.0001 would be smaller. And so we can keep going; for every element in $S$ you provide, I can provide a smaller number in $S$, and so $\min S$ doesn't actually exist--it's undefined. And same with the maximum element $\max S$.

The lack of guarantee of the existence of $\min$ and $\max$ is exactly why mathematicians invented the concepts of the infimum and supremum. The infimum of a set is the largest lower bound--a lower bound is a number such that every element in a set is greater than that. So for example, -1 is an example of a lower bound for $S$, but -0.5 would be a larger lower bound. Zero is a lowerbound for $S$, and it's easy to see that any number higher than that will cease to be a lower bound. Therefore, $\inf S = 0$. Similarly, the supremum is the smallest upper bound, so $\sup S = 1$. Infima and suprema are guaranteed to always exist, and in cases where minima and maxima exist within the given set , they coincide. For this reason, for the remainder of this post, I'll be using $\inf$ and $\sup$, but in your head you can effectively read them as $\min$ and $\max$.

This brings us back to first hitting times. Let $a\in \mathbb R$ be any real number. The <i>first hitting time</i> for when the stochastic process crosses $a$ is given by $\tau_a = \inf\\{t \ge 0 : X_t = 0\\}$. Immediately, as $\tau_a$ depends on the stochastic process, first hitting times are thus a random variable. And of course, first hitting times aren't guaranteed to happen. For example, if a stochastic process starts at $X_0 = 0$ and we're looking for the first time it hits $a = 100$, then it's entirely possible that the process never reaches it; it may simply just randomly move underneath it for all of time. In such cases, $\tau_a = +\infty$ by the definition of infimum ([the infimum of an empty set is infinity](https://en.wikipedia.org/wiki/Infimum_and_supremum#Infima_and_suprema_of_real_numbers)).

Let's now study our first stochastic process.


### Brownian motion

Let $\\{B_t : t \ge 0\\}$ by a stochastic process that takes values in $\mathbb R$. It's a <i>Brownian motion</i> if:
- The difference between its position at two different points in time ("increment") is normally distributed. That is, for every $t \ge 0$ and $\Delta \ge 0$, $B_{t+\Delta} - B_t \sim N(0, \Delta)$.
- Increments are independent of the past ("Markov property"). That is, for every $t \ge 0$ and $\Delta \ge 0$, $B_{t+\Delta} - B_t$ is independent of all $B_s$ for $s \le t$.
- It's always continuous. That is, $B_t(\omega)$ is continuous in $t$ for every $\omega\in\Omega$ ("in every possible universe"). "Continuous" just means that there are no sudden jumps, i.e. you can trace the entire path with a pen without needing to lift it up.
- It starts from the origin, i.e. $B_0 = 0$.

<span style="color: red;">Brownian motion simulation</span>

Brownian motion is a model for a lot of things. It was named after the botanist Robert Brown when he described how a single pollen of a plant moved in water (of course that would be a Brownian motion in $\mathbb R^3$). It's also commonly used for modelling quantities in finance, and even the motions of stars and black holes. A major reason for why Brownian motion is used so often is because of its mathematical elegance.

A neat thing about a Gaussian process is that if two stochastic processes are Gaussian and they have the same expectation and covariance structure $\text{Cov}(X_s, X_t) = \mathbb E[(X_s - \mathbb E[X_s])(X_t - \mathbb E[X_t])]$, then the stochastic processes have the same distribution.

<details>
<summary>Why is this true?</summary>

The distributions of random variables can be studied by looking at their characteristic functions $\varphi_X(\theta) = \mathbb E[e^{i\theta X}]$. If you know a little bit about differential equations or engineering, you might recognise that this is actually just the <a href="https://en.wikipedia.org/wiki/Fourier_transform">Fourier transform</a>. So once again, another example of the same concept appearing in totally different contexts!

Characteristic functions are useful because if two random variables have the same characteristic function, then they have the same distribution.

The characteristic function of a normal distribution can be straightforwardly computed as $\varphi(\theta) = \exp(-i\mu \theta - (\sigma\theta)^2/2)$. Similarly, a multivariate normal characteristic function looks like $\varphi(\boldsymbol{\theta}) = \exp(i\boldsymbol{\theta}^\intercal\boldsymbol{\mu} - \boldsymbol{\theta}^\intercal\boldsymbol{\Sigma}\boldsymbol{\theta}/2)$, where $\boldsymbol{\Sigma}$ is the covariance matrix. As only the mean vector and covariance matrix are the only parameters in the multivariate normal characteristic function, two multinormal distributions are the same if they have the same mean and covariances.

</details>

<br>

Using the Gaussian property along with a previous result on the scaling of normal random variables, it's straightforward to show that Brownian motions are <b>self-similar</b>. That is, for every $c > 0$, it holds that $\\{B_{ct} : t \ge 0\\}$ has the same distribution as $\\{\sqrt c B_t : t \ge 0\\}$. This is a really neat fractal property of the Brownian motion where zooming into (the time axis of) a Brownian motion ($c < 1$) will look like a Brownian motion.

<span style="color: red;">Brownian motion self-similar simulation</span>



### The reflection principle

The reflection principle is a useful way to formalise the idea that at any point of a Brownian motion's path, if we flip the direction of the Brownian motion moving forward after that point, the entire path of the resulting stochastic process is still a Brownian motion.

<span style="color: red">Reflection principle simulation here</span>

Let $a > 0$ be a threshold value and $\tau_a$ be the first hitting time of this threshold, i.e. $\tau_a = \inf\\{t \ge 0: B_t = a\\}$. Our motivating question is: what's the distribution of the first hitting time $\tau_a$?

We derive the reflection principle as follows:

$$\begin{align}
\mathbb P\left(\tau_a \le t\right) &= \mathbb P\left(\left\{\tau_a \le t\right\}\cap\left\{B_t \ge a\right\}\right) + \mathbb P\left(\left\{\tau_a \le t\right\}\cap\left\{B_t < a\right\}\right) \\
&= \mathbb P\left(B_t \ge a\right) + \mathbb P\left(\left\{\tau_a \le t\right\}\cap\left\{B_t < a\right\}\right) \\
&= \mathbb P\left(B_t \ge a\right) + \mathbb P\left(\tau_a \le t\right)\mathbb P\left(B_t < a | \tau_a \le t\right)\\
&= \mathbb P\left(B_t \ge a\right) + \mathbb P\left(\tau_a \le t\right)\mathbb P\left(B_t - B_{\tau_a} < a - B_{\tau_a}| \tau_a \le t\right)\\
&= \mathbb P\left(B_t \ge a\right) + \mathbb P\left(\tau_a \le t\right)\mathbb P\left(B_t - B_{\tau_a} < 0| \tau_a \le t\right)\\
&= \mathbb P\left(B_t \ge a\right) + \mathbb P\left(\tau_a \le t\right)\mathbb P\left(B_t - B_{\tau_a} < 0\right)\\
&= \mathbb P\left(B_t \ge a\right) + \frac12\mathbb P\left(\tau_a \le t\right),
\end{align}$$

where our equalities hold because:
1. Holds due to the [law of total probability](https://en.wikipedia.org/wiki/Law_of_total_probability), i.e. "event $A$" is the same as "(event $A$ and event $B$) or (event $A$ and not event $B$)". E.g. the statements "I'm in class" and "I'm either in class and paying attention, or in class and not paying attention" are equivalent.
1. Holds due to the fact that for $B_t \ge a$ to happen, the Brownian motion must have hit $a$ before or at time $t$, i.e. $\tau_a \le t$ must also happen, so $\\{\tau_a \le t\\}\cap\\{B_t \ge a\\} = \\{B_t \ge a\\}$. E.g. "I'm in class" and "I'm in class and this class is taking place" are equivalent, because I can't be in class if the class isn't happening in the first place.
1. Holds due to the definition of [conditional probability](https://en.wikipedia.org/wiki/Conditional_probability), i.e. $\mathbb P(A\|B) = \mathbb P(A\cap B) / \mathbb P(B)$.
1. Holds due to subtracting both sides of an inequality by the same quantity.
1. Holds due to $B_{\tau_a} = a$ by the definition of the hitting time $\tau_a$.
1. Holds due to the Markov property that the increment over $[\tau_a, t]$ is independent of the information up to time $\tau_a$. Since the event $\\{\tau_a \le t\\}$ is contained in the formation up to time $\tau_a$ (obviously, because at the moment that the first hit happens you'll know that it happened), the increment is thus independent of this event.
1. Holds due to the fact that $B_t - B_{\tau_a}$ is distributed as $N(0, t - \tau_a)$, which is a symmetric probability distribution around zero so $\mathbb P\left(B_t - B_{\tau_a} < 0\right) = 1/2$.

Rearranging what we have, it holds that $\mathbb P\left(\tau_a \le t\right) = 2\mathbb P\left(B_t \ge a\right)$. Now, note that $\\{\tau_a \le t\\} = \\{\sup_{0\le s\le t} B_s \ge a\\}$, as obviously the first hitting time for reaching $a$ happening before time $t$ is equivalent to saying that the Brownian motion has a peak at or above $a$ before time $t$. Thus, we obtain the reflection principle.

<b>Theorem (Reflection principle, Part 1).</b> Let $\{B_t : t \ge 0\}$ is a Brownian motion, $a > 0$ and $\tau_a = \inf\\{t \ge 0: B_t = a\\}$. Then, it holds that

$$\mathbb P(\sup\nolimits_{0\le s\le t} B_s \ge a) = \mathbb P\left(\tau_a \le t\right) = 2\mathbb P\left(B_t \ge a\right).$$

Technically, in our proof of the reflection principle we didn't fully use the fact that the stochastic process was a Brownian motion. In fact, our proof will still work for any stochastic process that:
- is continuous,
- has the Markov property where increments are independent of the past, and
- has increments such that $\mathbb P(X_t - X_s < 0) = 1/2$ (e.g. has a symmetric distribution centred at zero),

thus the reflection principle holds for such stochastic processes.

How do we make sense of this result? I find it easier to interpret when arranged as $\mathbb P\left(B_t \ge a\right) = \mathbb P(\tau_a \le t)/2$. Here's how to think about it:
- If the Brownian motion does meet or exceed $a$ in the time $[0,t]$, then after such point two things are possible:
  - either it'll finish at time $t$ in a position that exceeds $a$, i.e. $B_t \ge a$, or
  - it'll finish at time $t$ in a position lower than $a$, i.e. $B_t \le a$.
- Hence, $\mathbb P\left(B_t \ge a\right) + \mathbb P\left(B_t \le a\right) = \mathbb P(\tau_a \le t)$ (which we arrived at more formally above).
- But due to the symmetry of the Brownian motion, the probability of either happening is exactly the same, i.e. $\mathbb P\left(B_t \ge a\right) = \mathbb P\left(B_t \le a\right)$.
- Therefore, the probability that $B_t \ge a$ is exactly half of the probability of the Brownian motion exceeding $a$ before $t$ in the first place, i.e. $\mathbb P\left(B_t \ge a\right) = \mathbb P(\tau_a \le t)/2$.

<span style="color: red">Another reflection principle simulation here, that calls attention to (a) if the threshold passes, and if so (b) if $B_t \ge a$</span>

The formulation of the reflection principle as $\mathbb P(\sup\nolimits_{0\le s\le t} B_s \ge a) = 2\mathbb P\left(B_t \ge a\right)$ is incredibly useful because it directly gives us a way to compute the maximum position of a Brownian motion up until time $t$, which is exactly what $\sup_{0\le s\le t}B_s$ is. Specifically, by noting that due to the symmetry of the normal distribution, $2\mathbb P(B_t \ge a) = \mathbb P(\\{B_t \ge a\\}\cup\\{-B_t \ge a\\}) = \mathbb P(\|B_t\| \ge a)$, we thus have

$$\mathbb P(\sup\nolimits_{0\le s\le t} B_s \ge a) = \mathbb P(|B_t| \ge a),$$

which says that the maximum of a Brownian motion until time $t$ has the same distribution as $\|B_t\|$, which is called a [folded Brownian motion](https://en.wikipedia.org/wiki/Folded_normal_distribution).

The formulation of the reflection principle as $\mathbb P\left(\tau_a \le t\right) = 2\mathbb P\left(B_t \ge a\right) = 2(1 - \mathbb P\left(B_t < a\right))$ immediately answers the question of what the distribution of the first hitting time is for a Brownian motion, as $\mathbb P\left(B_t < a\right)$ is simply the cumulative distribution function for a $N(0,t)$ random variable. We can differentiate the expression with respect to $t$ to get the probability density for $\tau_a$ if we wanted to.

There is yet more to the reflection principle. If we go back to the proof at the beginning of this section and replace $B_t$ with $2B_{\tau_a} - B_t$ after the first equality, the rest of the proof still holds one-to-one, and so we arrive at a similar result that for every $a \ge 0$, $\mathbb P(\tau_a \le t) = 2\mathbb P(2B_{\tau_a} - B_t \ge a)$. Rearranging this to the cumulative probability function for $2B_{\tau_a} - B_t$, we see that

$$\mathbb P(2B_{\tau_a} - B_t \le a) = 1 - \mathbb P(2B_{\tau_a} - B_t > a) = 1 - \frac12\mathbb P(\tau_a \le t) = 1 - \mathbb P(B_t > a) = \mathbb P(B_t \le a),$$

that is, $2B_{\tau_a} - B_t$ and $B_t$ have the same distribution. (Technically we also need to show that the above holds for $a \le 0$, but once again it's easy to check that this is true by defining $\tau_a = \inf\\{0\le s\le t : B_t \le a\\}$ for $a < 0$ and repeating our proof again.) This leads to our second formulation of the reflection principle.

<b>Theorem (Reflection principle, Part 2).</b> Let $\\{B_t : t \ge 0\\}$ is a Brownian motion, $a > 0$ and $\tau_a = \inf\\{t \ge 0: B_t = a\\}$. Let

$$\tilde B_t = \begin{cases}
B_t\quad&\text{for } t \le \tau_a,\\
2B_{\tau_a} - B_t \quad& \text{for } t > \tau_a.
\end{cases}$$

Then, the process $\\{\tilde B_t : t\ge 0\\}$ is also a Brownian motion.

<span style="color: lightgrey">Technically, we need to verify that $\\{\tilde B_t : t\ge 0\\}$ is indeed a Brownian motion by showing that it meets the definition of a Brownian motion, but this is very easy to do by exploiting the fact that $\\{B_t : t\ge 0\\}$ is a Brownian motion.</span>

This version of the reflection principle formalises very explicitly the idea that if a Brownian motion gets "reflected" at the first hitting time for touching some threshold, it's sample path still just looks like a typical Brownian motion. Or in other words, that act of reflection had zero effect from a probabilistic view. This version of the reflection principle is the one that we'll use to prove the main theorem later.

<br>


### Brownian bridge

So far, we've managed to obtain the distribution of the first hitting time of a standard Brownian motion in the form of the reflection principle. We want to investigate this in the case of a more complicated Brownian motion, but before we do so we must introduce the Brownian bridge, which will be useful in our pursuit.

Let $\\{B_t : t \in [0,T]\\}$ be a Brownian motion over a fixed time interval $[0,T]$. Let's say that you know what the position of $B_T$ ahead of time. How might this arise? Maybe there's a particle that moves like a Brownian motion, and you know where the particle is currently. Then, you have an "information gap" where you don't know the exact path of how the particle got to where it is currently. For the sake of simplicity, we'll express this as $\\{(B_t \| B_T) : t \in [0,T]\\}$, where the "$\| B_T$" means "given the fact that we know what $B_T$ is" (i.e. we're "conditioning on $B_T$" in the language of conditional probability). Then this new stochastic process is called a <i>Brownian bridge</i>.

Let's talk a bit more about how this conditioning works. Since we know where $B_T$ is, $B_T \| B_T$ is deterministic. For example, if $B_T = a$, then $B_T \| (B_T = a) = a$. However, knowing $B_T$ is not enough to completely determine where $B_t$ is for $t < T$, so $B_t \| B_T$ is still random. That said, of course we can expect that knowing $B_T$ gives some information about $B_t$. For example, the closer $t$ is to $T$, the more we would expect $B_t$ to be closer to $B_T$ on average.

Why is this stochastic process called a "Brownian bridge"? Obviously it's "Brownian" because it's derived from a Brownian motion. But why "bridge"? Well, we know that $B_0 = 0$ and we know that $B_T = a$, so really this stochastic process is simply tracing out a continuous path from $(t, x) = (0, 0)$ to $(t, x) = (T, a)$. That is, it's creating a bridge between those two points, albeit a rough and jagged one.

The "marginal" distribution of a Brownian bridge is given by $B_t \| B_T \sim N((t/T)B_T, t(T-t) / T)$. It's not too hard to show this (hint: show that $B_t - (t/T)B_T$ is independent of $B_T$ and also make use of the [law of total expectation](https://en.wikipedia.org/wiki/Law_of_total_expectation) in the calculations). The distribution makes a lot of sense, right? Naturally as $t$ approaches $T$, the Brownian bridge gets closer to $B_T$ on average, and also the variance decreases (as we already know what $B_T$ is).

Another result that is fairly straightforward to compute is its covariance structure, namely $\text{Cov}(B_s B_t \| B_T) = s(T-t)/T$ for $s < t < T$. This is where we will terminate our short-lived discussion of the Brownian bridge, as we now have everything we need to describe and prove the main theorem of interest.

But before we move on, you may wonder "if this post is about Brownian motions, then why did we briefly talk about Brownian bridges?" The answer is simple: conditioning. In probability theory, a common strategy for deriving probabilistic quantities (probabilities, expectations, etc) is by dealing with conditional versions first. E.g. if I want to compute $\mathbb E[X]$, I might first start looking at the simpler problem of $\mathbb E[X \| \\{\text{some informative event that simplifies the expression}\\}]$. In fact, we've already used this strategy in our derivation of the reflection principle, and if you wanted to derive the mean, variance and covariance results of Brownian bridge in this section yourself, you'd want to apply the strategy of conditioning also.


<br>

## The theorem

We've seen [previously](#the-reflection-principle) how we can apply the reflection principle to derive the distribution of the first hitting time for a standard Brownian motion. Let's now consider a more general problem. Let $\mu\in\mathbb R$ and $\sigma > 0$, then $\\{\mu t + \sigma B_t : t \ge 0\\}$ is a <i>scaled Brownian motion with drift</i> (or a <i>generalised Brownian motion</i>). From our previous discussion of normal random variables, we can see that $\mu t + \sigma B_t \sim N(\mu t, \sigma^2 t)$. The drift parameter $\mu$ determines the direction and speed of the linear drift, while the scale parameter $\sigma$ determines the variance of the Brownian randomness.

<span style="color: red">Simulation for generalised Brownian motion</span>

Let $a > 0$ be a threshold value and $\tau_a = \inf\nolimits_{0 \le s \le t}\\{\mu t + \sigma B_t \ge a\\}$ be the first hitting time of when the generalised Brownian motion crosses the threshold $a$. Our question is the same: what's the distribution of $\tau_a$?

<b>Theorem (first hitting time of generalised Brownian motion).</b> Let $a > 0$ and $t > 0$. Then,

$$
\mathbb P(\tau_a \le t | \mu t + \sigma B_t \in dx) =
\begin{cases}
&\exp\left(-\frac{2a(a - x)}{\sigma^2 t}\right)\quad&\text{if } x \le a\\
&1 &\text{if } x > a,
\end{cases}$$

and

$$\mathbb P(\tau_a \le t) = 1 - \Phi\left(\frac{a - \mu t}{\sqrt{\sigma^2 t}}\right) + e^{2\mu a / \sigma^2} \Phi\left(\frac{-a -\mu t}{\sqrt{\sigma^2 t}}\right),$$

and

$$\mathbb E[\tau_a]
\begin{cases}
<+\infty\quad&\text{if } \mu > 0,\\
=+\infty\quad&\text{if } \mu \le 0,
\end{cases}$$

where $\Phi$ is the cumulative distribution function of a standard normal $N(0,1)$ random variable.

Isn't it strange that the first formula, which describes the probability distribution of the first hitting time of a Brownian motion with drift, doesn't actually depend on the drift parameter $\mu$ when conditioned by the process at time $t$? I wonder why! <span style="color: lightgrey">(Hint: keep reading.)</span>

The second formula is the cumulative distribution function for $\tau_a$, and it's straightforwardly obtained by applying the [law of total probability](https://en.wikipedia.org/wiki/Law_of_total_probability#Continuous_case) by integrating the first formula across all values of $x$.

The third result tells us that if the drift is in the positive direction, then the average hitting time is finite. But if the drift is in the negative direction or zero, then the mean time is infinite. This is a straightforward consequence of the second formula. Particularly, in the case where $\mu < 0$, then $\mathbb P(\tau_a = +\infty) > 0$. The interesting case is when $\mu = 0$, for which $\mathbb P(\tau_a < +\infty) = 1$ (i.e. the first hitting time is [almost surely](https://en.wikipedia.org/wiki/Almost_surely) finite) but $\mathbb E[\tau_a] = 0$.

<details>
<summary>How do we show this?</summary>
The results about the probabilities are easy to show, using the property that the cumulative distribution function $\Phi(x)$ goes to zero when $x\to-\infty$ and goes to one when $x\to+\infty$.

The results on the finiteness of the mean requires some additional knowledge. Firstly, it's a <a href="https://en.wikipedia.org/wiki/Expected_value#:~:text=Formulas%20in%20terms%20of%20CDF">well-known but perhaps counterintuitive fact</a> that

$$\mathbb E[X] = \int_0^{+\infty}(1 - F_X(x))\,dx$$

if the random variable $X$ doesn't take any negative values. Hence, when computing $\mathbb E[\tau_a]$, the inside of the integral is

$$f_\mu(t) = \Phi\left(\frac{a - \mu t}{\sqrt{\sigma^2 t}}\right) - e^{2\mu a / \sigma^2} \Phi\left(\frac{-a -\mu t}{\sqrt{\sigma^2 t}}\right).$$

To check whether the integral is finite, we need to understand the behaviour of $f_\mu(t)$ as $t\to+\infty$. The simplest way to do this is by looking at the asymptotic behaviour of $\Phi(x) = (1+\text{erf}(x))/2$. The <a href="https://en.wikipedia.org/wiki/Error_function#Asymptotic_expansion">asymptotic behaviour</a> of $\text{erf}(x)$ for large $x$ is $C\exp(-x^2)/x$ for some constant $C$.

</details>

<br>

Therefore, the second and third results in the theorem are merely consequences of the first result. That is, all we need to do is to prove the first one. But therein lies the problem. The usual derivation of this result in the literature is to invoke Girsanov's theorem, which allows us to "transform away" the drift component of the problem by changing the underlying probability measure $\mathbb P$. By doing this, we can straightforwardly apply our first hitting time result for a non-drifting Brownian motion. Unfortunately, Girsanov's theorem is rather advanced, and requires background knowledge of the more advanced field of [stochastic calculus](https://en.wikipedia.org/wiki/Stochastic_calculus) to prove.

Our challenge is to prove the first result in the above theorem using only the knowledge we have built up until now in this post.


<br>

## The proof

We first begin by considering the problem without the drift component. Let $\\{B_s : s\in[0,t]\\}$ be a standard Brownian motion over $[0,t]$. Let $\tau_a^0 = \inf\\{\sigma B_s: s\in[0,t]\\}$ be the first passage time for $\\{\sigma B_s : s\in[0,t]\\}$. Then, for $x \le a$, we have

$$\begin{align}
\mathbb P(\{\tau_a^0 \le t\}\cap\{\sigma B_t \in dx\}) &= \mathbb P(\{\tau_a^0 \le \sigma^2 t\}\cap\{B_{\sigma^2 t} \in dx\})\\
&= \mathbb P(2a - B_{\sigma^2 t} \in dx)\\
&= \mathbb P(N(2a, \sigma^2 t) \in dx)\\
&= \frac{1}{\sqrt{2\pi\sigma^2 t}} \exp\left(-\frac{(x - 2a)^2}{2\sigma^2 t}\right)\,dx,
\end{align}$$

where the equalities hold because:
1. Holds due to the self-similarity of Brownian motion.
1. Holds due to the second version of the reflection principle and applying the fact that $\sigma B_{\tau_a^0} = B_{\sigma^2 \tau_a^0} = a$ when $\tau_a^0 \le t$ is true.
1. Holds due to the fact that $2a - B_{\sigma^2 t}\sim N(2a, \sigma^2 t)$. Note that $2a - B_{\sigma^2 t}$ and $2a + B_{\sigma^2 t}$ has the same distribution due to the fact that the distribution of $B_{\sigma^2 t}$ is symmetric around zero.

Since $\\{\tau_a^0 \le t\\} = \\{\sup\nolimits_{0\le s\le t}\sigma B_s \ge a\\}$, we can apply the definition of conditional probability (in terms of probability densities) to get

$$\begin{align}
\mathbb P(\tau_a^0 \le t | \sigma B_t \in dx) &= \mathbb P(\sup\nolimits_{0\le s\le t}\sigma B_s \ge a | \sigma B_t \in dx)\\
&= \frac{\mathbb P(\{\tau_a^0 \le t\}\cap\{\sigma B_t\in dx\})}{\sigma B_t\in dx}\\
&= \frac{1}{\sqrt{2\pi\sigma^2 t}} \exp\left(-\frac{(x - 2a)^2}{2\sigma^2 t}\right)\,dx \bigg/ \frac{1}{\sqrt{2\pi\sigma^2 t}} \exp\left(-\frac{x^2}{2\sigma^2 t}\right)\,dx\\
&= \exp\left(-\frac{2a(a-x)}{\sigma^2 t}\right).
\end{align}$$

This is an interesting result in and of itself: since we've conditioned on $\sigma B_t$, this means we've actually derived the distribution for the maximum of a (scaled) Brownian bridge between times $[0,t]$. How neat!

Anyway, if you compare this to what we're trying to prove, it's exactly the same, except for the fact that we've left out the drift. So what we're going to do next is to consider the more general case with the drift in play and set up for an application of what we've just derived.

We propose that conditioning upon $\\{\mu t + \sigma B_t \in dx\\}$, the generalised Brownian motion $\\{\mu s + \sigma B_s : s\in[0,t]\\}$ becomes a "generalised" Brownian bridge similar to $\\{(\sigma B_s \| \sigma B_t) : s\in[0,t]\\}$. To show this, we can take advantage of the fact that it's a Gaussian process and thus we only need to show that the expectation and covariance structures match that of a generalised Brownian bridge.

The expectation is easily computed as

$$\mathbb E[\mu s + \sigma B_s | \mu t + \sigma B_t \in dx] = \mu s + \sigma\mathbb E[B_s | B_t \in (dx-\mu t)/\sigma] = \mu s + \sigma\frac{s}{t}\frac{dx - \mu t}{\sigma} = \frac{s}{t}dx,$$

where the second equality holds due to the marginal expectation of Brownian bridges we highlighted [earlier](#brownian-bridge). We that this expectation indeed aligns with the expectation of a Brownian bridge.

We now consider the covariance structure. Let $s_1 < s_2 < t$, then

$$\begin{align}
\text{Cov}(\mu s_1 + \sigma B_{s_1}, \mu s_2 + \sigma B_{s_2} |\mu t + \sigma B_t \in dx) &= \text{Cov}(\sigma B_{s_1}, \sigma B_{s_2} |  B_t \in (dx-\mu t)/\sigma)\\
&= \sigma^2 \text{Cov}(B_{s_1}, B_{s_2} |  B_t \in (dx-\mu t)/\sigma)\\
&= \sigma^2 \frac{s_1(t-s_2)}{t},
\end{align}$$

where the equalities hold because:
1. Holds due to the [covariance of linear combinations](https://en.wikipedia.org/wiki/Covariance#Covariance_of_linear_combinations).
1. ^^^
1. Holds due to the covariance of standard Brownian bridges we highlighted [earlier](#brownian-bridge).

We see that this covariance structure indeed matches with that of a scaled ("generalised") Brownian bridge. Therefore, indeed the generalised Brownian motion $\\{\mu s + \sigma B_s : s\in[0,t]\\}$ becomes a generalised Brownian bridge $\\{(\sigma B_s \| \sigma B_t \in dx) : s\in[0,t]\\}$ when conditioned on $\\{\mu t + \sigma B_t \in dz\\}$. And so we see that upon conditioning, the drift parameter vanishes completely! This is why the drift parameter doesn't appear in the formula that we're trying to derive. But how should we make sense of this intuitively? Well, recall that the expectation of a Brownian bridge $\mathbb E[B_s \| B_t] = (s/t) B_t$ is a linear drift in and of itself. So what's actually happening is that the drift term in the generalised Brownian motion becomes absorbed by the expectation structure of the Brownian bridge, as conditioning on any future point causes the Brownian bridge to drift towards that point on average anyway.

Therefore, applying everything we've derived in this section, it holds that for $x \le a$,

$$\mathbb P(\tau_a \le t | \mu t + \sigma B_t \in dx) = \mathbb P(\tau_a^0 \le t | \sigma B_t \in dx) = \exp\left(-\frac{2a(a-x)}{\sigma^2 t}\right).$$

For $x > a$, $\mathbb P(\tau_a \le t \| \mu t + \sigma B_t \in dx) = 1$ as the generalised Brownian motion being at $x$ at time $t$ can only happen if $\tau_a \le t$ is also true.

That's it!


<br>

<script type="text/x-mathjax-config">
  MathJax.Hub.Config({
    tex2jax: {
      inlineMath: [ ['$','$'], ["\\(","\\)"] ],
      processEscapes: true
    }
  });
</script>

<script type="text/javascript" async
    src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML">
</script>
