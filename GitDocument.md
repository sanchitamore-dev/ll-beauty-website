# Git and GitHub Documentation for L.L Beauty Website

This document explains, in simple words, how we created a GitHub account, created a GitHub repository for this project, pushed our website code to our own repository, and then pushed the same code to a friend's repository.

The project folder name is:

```text
ll-beauty-website
```

The main GitHub repository we created is:

```text
sanchitamore-dev/ll-beauty-website
```

The friend's repository where we also pushed the code is:

```text
energeia-369/L.L-frontend
```

## 1. What Is Git?

Git is a tool that helps us save and track changes in our project files.

For example, if we change `about.html`, `style.css`, or `script.js`, Git can remember those changes.

Git is useful because:

- It keeps a history of project changes.
- It helps us go back to old versions if something breaks.
- It helps multiple people work on the same project.
- It helps us upload code from our computer to GitHub.

## 2. What Is GitHub?

GitHub is a website where we can store our Git projects online.

Think of GitHub like Google Drive for code, but with extra features for developers.

GitHub helps us:

- Store website code online.
- Share code with friends or team members.
- Work together on the same project.
- Keep a backup of our project.
- Show our work to others.

## 3. Creating a GitHub Account

To use GitHub, first we created a GitHub account.

The steps were:

1. Open the GitHub website:

   ```text
   https://github.com
   ```

2. Click on **Sign up**.

3. Enter an email address.

4. Create a password.

5. Choose a username.

   In our case, the GitHub username is:

   ```text
   sanchitamore-dev
   ```

6. Verify the email address if GitHub asks for verification.

7. After signup, the GitHub account was ready to use.

## 4. What Is a Repository?

A repository, also called a repo, is a project folder stored on GitHub.

For this website, we created a repository named:

```text
ll-beauty-website
```

So the full repository name became:

```text
sanchitamore-dev/ll-beauty-website
```

This means:

- `sanchitamore-dev` is the GitHub account name.
- `ll-beauty-website` is the project repository name.

## 5. Creating Our Own GitHub Repository

After creating the GitHub account, we created a new repository for this website.

The steps were:

1. Open GitHub.

2. Login to the account.

3. Click the **+** button near the top right.

4. Click **New repository**.

5. Enter the repository name:

   ```text
   ll-beauty-website
   ```

6. Keep the repository public or private depending on the requirement.

7. Click **Create repository**.

After this, GitHub created an empty online repository for our website.

## 6. Connecting Our Local Folder With GitHub

The website files were already present in this local folder:

```text
ll-beauty-website
```

To connect this folder with GitHub, Git was used.

First, we opened the project folder in the terminal.

Then we initialized Git if it was not already initialized:

```bash
git init
```

This command tells Git to start tracking this folder.

Then we connected the local folder to our GitHub repository.

The remote name used for our own GitHub repository is:

```text
origin
```

The repository URL is:

```text
https://github.com/sanchitamore-dev/ll-beauty-website.git
```

The command for adding the remote was:

```bash
git remote add origin https://github.com/sanchitamore-dev/ll-beauty-website.git
```

If the remote already exists, we can check it using:

```bash
git remote -v
```

In this project, `origin` points to:

```text
https://github.com/sanchitamore-dev/ll-beauty-website.git
```

## 7. Adding Project Files to Git

Before pushing code to GitHub, we first need to tell Git which files should be saved.

To add all files, we used:

```bash
git add .
```

This command means:

- Add all new files.
- Add all changed files.
- Prepare them for saving in Git.

## 8. Creating a Commit

A commit is like a saved version of the project.

After adding files, we created a commit:

```bash
git commit -m "Initial commit"
```

The message `"Initial commit"` means this was the first saved version of the project.

Commit messages should be short and clear, for example:

```bash
git commit -m "Update about page"
git commit -m "Add product images"
git commit -m "Fix contact form style"
```

## 9. Pushing Code to Our Own Repository

After committing the code, we pushed it to our own GitHub repository.

Many GitHub projects use a branch called `main`. If the local branch is `main`, the command is:

```bash
git push -u origin main
```

This means:

- `git push` uploads code to GitHub.
- `origin` is our own GitHub repository.
- `main` is the branch name.
- `-u` remembers this connection for future pushes.

In this local project, the current branch name is:

```text
ll-beauty-change
```

So if we want to push this current branch, we can use:

```bash
git push -u origin ll-beauty-change
```

After this, the website code was available on GitHub at:

```text
https://github.com/sanchitamore-dev/ll-beauty-website
```

## 10. Friend Shared Their Repository

After we pushed the code to our own repository, a friend shared their GitHub repository with us.

The friend's repository is:

```text
energeia-369/L.L-frontend
```

The full repository URL is:

```text
https://github.com/energeia-369/L.L-frontend.git
```

This means:

- `energeia-369` is the friend's GitHub account or organization name.
- `L.L-frontend` is the friend's repository name.

To push code to a friend's repository, we need permission from the friend.

The friend can give permission by:

- Adding us as a collaborator on GitHub.
- Giving write access to the repository.
- Sharing access through an organization or team.

Without permission, GitHub will not allow us to push code to that repository.

## 11. Adding Friend's Repository as Another Remote

Our own repository was already connected as `origin`.

For the friend's repository, we added a second remote.

The remote name used for the friend's repository is:

```text
teamrepo
```

The command was:

```bash
git remote add teamrepo https://github.com/energeia-369/L.L-frontend.git
```

Now this local project is connected to two GitHub repositories:

```text
origin   -> sanchitamore-dev/ll-beauty-website
teamrepo -> energeia-369/L.L-frontend
```

We can check both remotes using:

```bash
git remote -v
```

In this project, the output shows:

```text
origin   https://github.com/sanchitamore-dev/ll-beauty-website.git
teamrepo https://github.com/energeia-369/L.L-frontend.git
```

## 12. Pushing Code to Friend's Repository

After adding the friend's repository as `teamrepo`, we pushed the same code there.

If pushing the `main` branch, the command was:

```bash
git push teamrepo main
```

This means:

- Push the current code.
- Send it to the remote named `teamrepo`.
- Push it to the `main` branch.

If pushing the current local branch in this project, the command is:

```bash
git push teamrepo ll-beauty-change
```

After this, the same website code was available in the friend's repository:

```text
https://github.com/energeia-369/L.L-frontend
```

## 13. Normal Workflow After Making Changes

Whenever we make new changes in the website, we should follow these steps.

First, check which files changed:

```bash
git status
```

Then add all changed files:

```bash
git add .
```

Then create a commit:

```bash
git commit -m "Describe the changes here"
```

Then push to our own repository:

```bash
git push origin main
```

Then push to the friend's repository:

```bash
git push teamrepo main
```

If the current branch is `ll-beauty-change`, use these commands instead:

```bash
git push origin ll-beauty-change
git push teamrepo ll-beauty-change
```

## 14. Simple Example

Suppose we changed the `about.html` file.

The steps would be:

```bash
git status
git add .
git commit -m "Update about page"
git push origin main
git push teamrepo main
```

If working on the `ll-beauty-change` branch, the push commands would be:

```bash
git push origin ll-beauty-change
git push teamrepo ll-beauty-change
```

After these commands:

- The change is saved in Git.
- The change is uploaded to our own GitHub repo.
- The change is also uploaded to the friend's GitHub repo.

## 15. Important Commands

Check current Git status:

```bash
git status
```

Add all files:

```bash
git add .
```

Create a commit:

```bash
git commit -m "Your message"
```

Check connected GitHub repositories:

```bash
git remote -v
```

Push to our own repository:

```bash
git push origin main
```

Push current project branch to our own repository:

```bash
git push origin ll-beauty-change
```

Push to friend's repository:

```bash
git push teamrepo main
```

Push current project branch to friend's repository:

```bash
git push teamrepo ll-beauty-change
```

Download latest changes from our own repository:

```bash
git pull origin main
```

Download latest changes from our own repository branch:

```bash
git pull origin ll-beauty-change
```

Download latest changes from friend's repository:

```bash
git pull teamrepo main
```

Download latest changes from friend's repository branch:

```bash
git pull teamrepo ll-beauty-change
```

## 16. Difference Between `origin` and `teamrepo`

In this project, we have two remotes.

`origin` is our own GitHub repository:

```text
sanchitamore-dev/ll-beauty-website
```

`teamrepo` is the friend's GitHub repository:

```text
energeia-369/L.L-frontend
```

When we run:

```bash
git push origin main
```

the code goes to our own repository.

If we are using the current project branch, we can run:

```bash
git push origin ll-beauty-change
```

When we run:

```bash
git push teamrepo main
```

the code goes to the friend's repository.

If we are using the current project branch, we can run:

```bash
git push teamrepo ll-beauty-change
```

## 17. Things to Remember

- Git saves changes on our computer.
- GitHub stores our code online.
- A repository is a project folder on GitHub.
- `origin` is usually the main repository.
- We used `teamrepo` for the friend's repository.
- We must commit before pushing.
- We need permission to push to another person's repository.
- Use `git status` often to understand what is happening.

## 18. Final Summary

We created a GitHub account with the username:

```text
sanchitamore-dev
```

Then we created our own GitHub repository:

```text
sanchitamore-dev/ll-beauty-website
```

We connected our local website folder to this repository using the remote name:

```text
origin
```

Then we added, committed, and pushed the website code to our own repository.

After that, our friend shared another repository with us:

```text
energeia-369/L.L-frontend
```

We added this friend's repository as another remote using the name:

```text
teamrepo
```

Then we pushed the same website code to the friend's repository too.

So now this project code is connected with two GitHub repositories:

```text
origin   -> sanchitamore-dev/ll-beauty-website
teamrepo -> energeia-369/L.L-frontend
```
