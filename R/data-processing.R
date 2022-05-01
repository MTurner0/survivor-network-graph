library(survivoR) # For data
library(dplyr) # For data wrangling

# Load data on all Survivor castaways
data("castaways")

## Transform into edge list

# get vector of all castaway IDs
all_castaway_ids <- castaways %>% 
  select(castaway_id) %>% 
  pull() %>% 
  unique()

# return TRUE if castaway has appeared at least twice, FALSE o/w
is_returner <- sapply(all_castaway_ids, 
                      FUN = function(x) {
                        sum(x == castaways$castaway_id) > 1
                        })

# keep only returners
returner_ids <- all_castaway_ids[is_returner]

returner_seasons <- lapply(returner_ids, FUN = function(x) {
  castaways %>% 
    filter(castaway_id == x) %>% 
    select(season) %>% 
    pull() %>% 
    # Get rid of duplicate seasons: i.e. where the "returner" was just on EOE or
    # Redemption Island
    unique()
})

names(returner_seasons) <- returner_ids

# Remove "returners" who were just on EOE or RI
returner_seasons <- returner_seasons[sapply(returner_seasons, 
                                            FUN = function(x) { 
                                              length(x) > 1 
                                              })]

# A function that will make an edge between a returner's first and future
# seasons 
# TODO: make edges between each pair of seasons a returner was on?
edge_list_builder <- function(season_vector) {
  n <- length(season_vector)
  df <- data.frame(source = rep(season_vector[1], n - 1),
                   target = season_vector[2:n])
  return(df)
}

# Count number of returners (edges) between each pair of seasons
edge_list <- lapply(returner_seasons, FUN = edge_list_builder) %>% 
  do.call(what = rbind, args = .) %>% 
  group_by(source, target) %>% summarize(strength = n())

# Vector of seasons that have had returners
node_data <- castaways %>% 
  filter(season %in% c(edge_list$source, edge_list$target)) %>% 
  select(season, season_name) %>% 
  unique()

# Create vector indicating season "type"
node_data$type <- rep("All newbies", nrow(node_data))
node_data$type[node_data$season %in% c(16, 26, 27)] <- "Half and half"
node_data$type[node_data$season %in% c(11, 22, 23, 25, 38)] <- "Captains"
node_data$type[node_data$season %in% c(8, 20, 20, 31, 34, 40)] <- "All returners"

# Transform into graph
network <- igraph::graph_from_data_frame(d = edge_list, directed = FALSE,
                                         vertices = node_data)

# Transform into JSON
data_json <- d3r::d3_igraph(network)

write(data_json, "returners.json")

