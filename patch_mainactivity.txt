                            MainScreen(
                                onNavigateToGuestMyEvents = { vm.navigateToGuestMyEvents() },
                                onNavigateToMyEvents = { vm.navigateToMyEvents() },
                                onNavigateToMyCommunities = { vm.navigateToMyCommunities() },
                                onCreateCommunity = { vm.navigateToCreateCommunity() },
                                onJoinCommunity = { vm.navigateToJoinCommunity() },
                                onNavigateToCommunityFeed = { communityId -> vm.navigateToCommunityFeed(communityId) }
                            )

