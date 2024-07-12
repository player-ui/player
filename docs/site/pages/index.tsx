import React from "react";
import { Link } from "react-router-dom";

import {
  ButtonGroup,
  VStack,
  Heading,
  Button,
  Image,
  Box,
  Text,
  Link as CLink,
  Divider,
  Container,
  HStack,
  SimpleGrid,
  useColorModeValue,
} from "@chakra-ui/react";
import { EditIcon, LinkIcon, UnlockIcon, SettingsIcon } from "@chakra-ui/icons";
import { Img } from "../components/mdx-components";
import { GitHubButton } from "../components/Navigation";
import { ColorSchemeSwitch } from "../components/ColorSchemeSwitch";
import { withBasePrefix } from "../components/Image";
import { PlayerDemo } from "../components/player-demo/PlayerDemo";

const TagLine = (props: {
  title: React.ReactNode;
  description: React.ReactNode;
  // eslint-disable-next-line react/no-unused-prop-types
  icon: typeof EditIcon;
}) => {
  return (
    <Box>
      <HStack>
        <props.icon w={10} h={10} />
        <Container w="sm">
          <Heading as="h3" size="md">
            {props.title}
          </Heading>
          <Text>{props.description}</Text>
        </Container>
      </HStack>
    </Box>
  );
};

const TagLines = () => {
  return (
    <SimpleGrid p="10" spacing="10" columns={{ base: 1, md: 2 }}>
      <TagLine
        icon={EditIcon}
        title="Write once, render everywhere"
        description="Sharing content across platforms enables you to quickly release new
        features, on all platforms, with just a simple content deployment."
      />
      <TagLine
        icon={LinkIcon}
        title="Bring your own design system"
        description={
          <span>
            Player works seamlessly with your existing UI components to fit
            application. Define your own patterns through{" "}
            <CLink as={Link} color="blue.600" to="/assets">
              assets
            </CLink>{" "}
            and render them exactly as your designers intended.
          </span>
        }
      />
      <TagLine
        icon={UnlockIcon}
        title="Server Driven Navigation"
        description={
          <span>
            Need to figure out where go next? Chaining multiple pages together
            with Player is a breeze. Check out the{" "}
            <CLink
              as={Link}
              color="blue.600"
              to="/guides/multi-flow-experiences"
            >
              docs
            </CLink>{" "}
            for more details.
          </span>
        }
      />
      <TagLine
        icon={SettingsIcon}
        title="Plugin Ready"
        description={
          <span>
            Player is designed from the ground up with plugins in mind.{" "}
            <CLink as={Link} color="blue.600" to="/plugins">
              Read more
            </CLink>{" "}
            about the 20+ provided plugins, or how to write your own.
          </span>
        }
      />
    </SimpleGrid>
  );
};

const Banner = () => {
  const logoSrc = useColorModeValue(
    withBasePrefix("/logo/logo-light-large.png"),
    withBasePrefix("/logo/logo-dark-large.png"),
  );

  return (
    <VStack w="100%" p="10">
      <Image alt="Player Logo" src={logoSrc} />
      <Heading as="h1" size="md" mt="10">
        A cross-platform semantic rendering engine
      </Heading>
    </VStack>
  );
};

const Home = () => {
  return (
    <Box pb="40">
      {/* <Head>
        <title>Player</title>
      </Head> */}
      <Box>
        <HStack
          px="6"
          minH="16"
          alignItems="center"
          justify="flex-end"
          spacing="4"
        >
          <ColorSchemeSwitch />
          <GitHubButton />
        </HStack>
      </Box>
      <Divider />
      <VStack pt="16" gap="12" width="100%">
        <VStack gap="8">
          <Banner />

          <ButtonGroup spacing="6" size="lg">
            <Link to="/about">
              <Button variant="outline">Learn More</Button>
            </Link>

            <Link to="/getting-started">
              <Button variant="solid">Get Started</Button>
            </Link>
          </ButtonGroup>
        </VStack>
        <Divider />
        <Box>
          <Img
            alt="Player Platform Diagram"
            src="/platform_diagram.png?darkModeInvert"
          />
        </Box>
        <TagLines />
        <Divider />

        <Heading>See it in action</Heading>
        <PlayerDemo />
      </VStack>
    </Box>
  );
};

export default Home;
