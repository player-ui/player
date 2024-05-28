import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Flex,
  Image,
  Button,
  Box,
  HStack,
  useColorModeValue,
  Icon,
  Link as CLink,
  IconButton,
  chakra,
  Drawer,
  Heading,
  Text,
  UnorderedList,
  useDisclosure,
  useBreakpointValue,
  DrawerContent,
  AlertTitle,
  AlertDescription,
  Select,
} from "@chakra-ui/react";
import { FaReact, FaApple, FaAndroid, FaPuzzlePiece } from "react-icons/fa";
import { HamburgerIcon } from "@chakra-ui/icons";
import type { Route } from "../config/navigation";
import NAV, { PATH_TO_NAV, Platform } from "../config/navigation";
import { ColorSchemeSwitch } from "./ColorSchemeSwitch";
import { DOCS_BASE_URL, GITHUB_URL } from "../config/constants";
import { withBasePrefix } from "./Image";
import { SearchInput } from "./Search";
import { GithubIcon } from "./gh-icon";
import { WarningBanner } from "./SiteBanner";

const getPathFromRoute = (route: Route): string => {
  if (route.path) {
    return route.path;
  }

  if (route.routes) {
    for (const r of route.routes) {
      const nestedRoute = getPathFromRoute(r);
      if (nestedRoute) {
        return nestedRoute;
      }
    }
  }

  return "";
};

const PlatformIcon = (props: any) => {
  if (props.platform === Platform.core) {
    return <FaPuzzlePiece />;
  }
  if (props.platform === Platform.react) {
    return <FaReact />;
  }
  if (props.platform === Platform.ios) {
    return <FaApple />;
  }
  if (props.platform === Platform.android) {
    return <FaAndroid />;
  }
  return <div />;
};

const NavTitleOrLink = (props: { route: Route }) => {
  const { route } = props;
  const { pathname, search } = useLocation();
  const selectedButtonColor = useColorModeValue("blue.800", "blue.600");

  if (route.path) {
    return (
      <Button
        as={Link}
        size="sm"
        variant="ghost"
        mx="3"
        colorScheme={pathname === route.path ? "blue" : "gray"}
        to={{
          pathname: route.path,
          search,
        }}
        color={pathname === route.path ? selectedButtonColor : undefined}
      >
        <HStack spacing="2">
          <Text>{route.title}</Text>
          {route.metaData?.platform?.map((p) => (
            <PlatformIcon key={p} platform={p} />
          ))}
        </HStack>
      </Button>
    );
  }

  return (
    <Heading as="h4" size="md" mt="8">
      {route.title}
    </Heading>
  );
};

const SideNavigationList = (props: { route: Route }) => {
  const { route } = props;

  return (
    <Box>
      <NavTitleOrLink route={route} />

      {route.routes && (
        <UnorderedList spacing={1} ml="0" mt="2" styleType="none">
          {route.routes.map((r) => (
            <SideNavigationList key={r.title} route={r} />
          ))}
        </UnorderedList>
      )}
    </Box>
  );
};

export const SideNavigation = () => {
  const { pathname } = useLocation();
  const subRoutes = PATH_TO_NAV.get(pathname);

  const route = NAV.routes.find((r) => r.title === subRoutes?.[0]);

  if (!route) {
    return null;
  }

  return (
    <Box as="nav">
      <SideNavigationList route={route} />
    </Box>
  );
};

export const Footer = () => {
  return null;
};

export const GitHubButton = () => {
  return (
    <Link aria-label="Go to our GitHub page" to={GITHUB_URL}>
      <IconButton
        variant="ghost"
        aria-label="Go to our Github page"
        icon={
          <Icon
            as={GithubIcon}
            display="block"
            transition="color 0.2s"
            w="5"
            h="5"
          />
        }
      />
    </Link>
  );
};

const useGetReleasedVersions = () => {
  const [releasedVersions, setReleasedVersions] = React.useState<
    {
      label: string;
      path: string;
    }[]
  >([]);

  React.useEffect(() => {
    const send = async () => {
      const response = await fetch(
        "https://api.github.com/repos/player-ui/player-ui.github.io/contents/",
      );

      const data = await response.json();
      const versions = data
        .filter((d: any) => d.type === "dir" && d.name.match(/^v\d/))
        .map((d: any) => ({
          label: d.name,
          path: d.name,
        }));

      setReleasedVersions(versions);
    };

    send().catch(() => {});
  }, []);

  return releasedVersions;
};

export const VersionSelector = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const released = useGetReleasedVersions();

  return (
    <Select
      aria-label="Select the version of the Player docs you with to see"
      variant="unstyled"
      rootProps={{
        width: "auto",
        display: "flex",
        flexShrink: "0",
      }}
      value={location.pathname || "/latest"}
      onChange={(e) => {
        navigate(`${DOCS_BASE_URL}/${e.target.value}`);
      }}
    >
      <option value="latest">Latest</option>
      <option value="next">Next</option>
      {released.map((r) => (
        <option key={r.label} value={r.path}>
          {r.label}
        </option>
      ))}
    </Select>
  );
};

export const TopNavigation = () => {
  const { pathname, search } = useLocation();
  const subRoutes = PATH_TO_NAV.get(pathname);
  const mobileNavDisclosure = useDisclosure();

  const currentTopLevelRoute = NAV.routes.find(
    (r) => r.title === subRoutes?.[0],
  );

  const logoSrc = useBreakpointValue({
    base: useColorModeValue(
      withBasePrefix("/logo/logo-light-small.png"),
      withBasePrefix("/logo/logo-dark-small.png"),
    ),
    lg: useColorModeValue(
      withBasePrefix("/logo/logo-light-large.png"),
      withBasePrefix("/logo/logo-dark-large.png"),
    ),
  });

  const selectedButtonColor = useColorModeValue("blue.800", "blue.600");

  return (
    <Flex w="100%" h="100%" direction="column" align="center">
      <Flex px="6" w="100%" h="100%" align="center" justify="space-between">
        <HStack>
          <IconButton
            variant="ghost"
            icon={<HamburgerIcon />}
            display={{ base: "flex", md: "none" }}
            aria-label="Open Side Navigation Menu"
            onClick={mobileNavDisclosure.onOpen}
          />
          <CLink
            as={Link}
            to="/"
            display={{
              base: "none",
              md: "block",
            }}
            py="2"
          >
            <Image alt="Player Logo" height="48px" src={logoSrc} />
          </CLink>
        </HStack>

        <Box>
          <HStack spacing="4">
            <Box display={{ base: "none", lg: "block" }}>
              <SearchInput />
            </Box>
            {NAV.routes.map((topRoute) => {
              const navRoute = getPathFromRoute(topRoute);
              const isSelected = currentTopLevelRoute?.title === topRoute.title;

              return (
                <Button
                  as={Link}
                  key={topRoute.title}
                  to={{
                    pathname: navRoute,
                    search,
                  }}
                  variant="ghost"
                  colorScheme={isSelected ? "blue" : "gray"}
                  color={isSelected ? selectedButtonColor : undefined}
                  size="md"
                  ml="0"
                >
                  {topRoute.title}
                </Button>
              );
            })}
            <VersionSelector />
            <ColorSchemeSwitch />
            <GitHubButton />
          </HStack>
        </Box>
        <Drawer
          isOpen={mobileNavDisclosure.isOpen}
          placement="left"
          onOverlayClick={mobileNavDisclosure.onClose}
          onClose={mobileNavDisclosure.onClose}
        >
          <DrawerContent>
            <Box px="10" maxH="100vh" overflowY="auto">
              <SideNavigation />
            </Box>
          </DrawerContent>
        </Drawer>
      </Flex>
      <WarningBanner>
        <AlertTitle>
          Player and its documentation are still in early development.
        </AlertTitle>
        <AlertDescription>
          If you find any issues, please report them to us on{" "}
          <CLink
            color={useColorModeValue("blue.800", "blue.600")}
            href="https://github.com/player-ui/player/issues"
          >
            GitHub
          </CLink>
          .
        </AlertDescription>
      </WarningBanner>
    </Flex>
  );
};
